import os
import hmac
import hashlib
import mercadopago
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from db import db, now
from services import checkout

router = APIRouter(prefix="/api", tags=["payments"])
sdk = mercadopago.SDK(os.environ.get("MERCADOPAGO_ACCESS_TOKEN", ""))
MP_WEBHOOK_SECRET = os.environ.get("MERCADOPAGO_WEBHOOK_SECRET", "")
MP_NOTIFICATION_URL = os.environ.get("MERCADOPAGO_NOTIFICATION_URL", "")


class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str


@router.post("/payments/checkout")
async def create_payment(req: CheckoutRequest):
    order = await db.orders.find_one({"_id": req.order_id})
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    if order.get("payment_status") == "paid":
        raise HTTPException(400, "Pedido já foi pago")
    amount = round(float(order["total"]), 2)
    if amount < 0.5:
        raise HTTPException(400, "Valor mínimo não atingido")

    success_url = f"{req.origin_url}/pedido/sucesso?session_id={order['_id']}"
    preference_data = {
        "items": [{
            "title": f"Pedido {order['number']} — Femmora",
            "quantity": 1,
            "unit_price": amount,
            "currency_id": "BRL",
        }],
        "back_urls": {
            "success": success_url,
            "pending": success_url,
            "failure": f"{req.origin_url}/checkout",
        },
        "auto_return": "approved",
        "external_reference": order["_id"],
    }
    if MP_NOTIFICATION_URL:
        preference_data["notification_url"] = MP_NOTIFICATION_URL

    result = sdk.preference().create(preference_data)
    if result.get("status") not in (200, 201):
        raise HTTPException(502, "Falha ao criar preferência de pagamento no Mercado Pago")
    pref = result["response"]
    checkout_url = pref.get("init_point") or pref.get("sandbox_init_point")

    await db.payment_transactions.insert_one({
        "session_id": order["_id"],
        "order_id": order["_id"],
        "mp_preference_id": pref["id"],
        "amount": amount,
        "currency": "brl",
        "status": "initiated",
        "payment_status": "pending",
        "created_at": now(),
        "updated_at": now(),
    })
    await db.orders.update_one({"_id": order["_id"]},
                               {"$set": {"mp_preference_id": pref["id"], "updated_at": now()}})
    return {"checkout_url": checkout_url, "session_id": order["_id"]}


@router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(404, "Transação não encontrada")
    if record.get("payment_status") != "paid":
        try:
            search = sdk.payment().search(filters={"external_reference": record["order_id"]})
            results = search.get("response", {}).get("results", [])
            approved = next((p for p in results if p.get("status") == "approved"), None)
            if approved:
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid",
                             "mp_payment_id": approved["id"], "updated_at": now()}})
                await checkout.finalize_paid(record["order_id"])
                record = await db.payment_transactions.find_one({"session_id": session_id})
        except Exception:
            pass
    order = await db.orders.find_one({"_id": record["order_id"]})
    return {"session_id": record["session_id"], "status": record["status"],
            "payment_status": record["payment_status"],
            "order_id": record["order_id"],
            "order_number": order["number"] if order else None}


def _valid_signature(x_signature: str, x_request_id: str, data_id: str) -> bool:
    if not MP_WEBHOOK_SECRET:
        return True
    parts = dict(p.strip().split("=", 1) for p in x_signature.split(",") if "=" in p)
    ts, v1 = parts.get("ts", ""), parts.get("v1", "")
    if not ts or not v1:
        return False
    manifest = f"id:{data_id.lower()};request-id:{x_request_id};ts:{ts};"
    expected = hmac.new(MP_WEBHOOK_SECRET.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, v1)


@router.post("/mercadopago/webhook")
async def mercadopago_webhook(request: Request):
    data_id = request.query_params.get("data.id", "")
    notif_type = request.query_params.get("type") or request.query_params.get("topic")

    if data_id and not _valid_signature(
        request.headers.get("x-signature", ""), request.headers.get("x-request-id", ""), data_id
    ):
        raise HTTPException(401, "Assinatura inválida")

    if notif_type == "payment" and data_id:
        payment = sdk.payment().get(data_id)
        p = payment.get("response", {})
        status = p.get("status")
        order_id = p.get("external_reference")
        if order_id and status == "approved":
            rec = await db.payment_transactions.find_one({"order_id": order_id})
            await db.payment_transactions.update_one(
                {"order_id": order_id, "payment_status": {"$ne": "paid"}},
                {"$set": {"status": "completed", "payment_status": "paid",
                         "mp_payment_id": data_id, "updated_at": now()}})
            if rec:
                await checkout.finalize_paid(order_id)
        elif order_id and status in ("rejected", "cancelled"):
            rec = await db.payment_transactions.find_one({"order_id": order_id})
            await db.payment_transactions.update_one({"order_id": order_id},
                {"$set": {"status": status, "payment_status": status, "updated_at": now()}})
            if rec:
                await checkout.cancel_order(order_id, "Pagamento não aprovado")
    return {"status": "ok"}
