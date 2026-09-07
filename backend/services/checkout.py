"""Cart quote, coupon validation, shipping and order creation. All money computed here."""
from fastapi import HTTPException
from db import db, now, next_sequence
from services.pricing import variant_pricing, variant_available
from services import inventory

FREE_SHIPPING_THRESHOLD = 300.0
SHIPPING_METHODS = {
    "pac": {"label": "PAC", "price": 19.90, "eta": "6 a 10 dias úteis"},
    "sedex": {"label": "SEDEX", "price": 29.90, "eta": "3 a 5 dias úteis"},
    "expressa": {"label": "Entrega Expressa", "price": 39.90, "eta": "1 a 2 dias úteis"},
}


def _find_variant(product, variant_id):
    for v in product.get("variants", []):
        if v.get("id") == variant_id:
            return v
    return None


async def build_line_items(items):
    """Resolve items against DB, returning enriched lines + subtotal. Raises on stock issues."""
    lines = []
    subtotal = 0.0
    for it in items:
        product = await db.products.find_one({"_id": it.get("product_id")})
        if not product or product.get("status") != "active":
            raise HTTPException(400, "Produto indisponível")
        variant = _find_variant(product, it.get("variant_id"))
        if not variant:
            raise HTTPException(400, "Selecione uma variação válida")
        qty = int(it.get("qty", 1))
        if qty <= 0:
            raise HTTPException(400, "Quantidade inválida")
        avail = variant_available(variant)
        if avail < qty:
            raise HTTPException(409, f"Estoque insuficiente para {product['name']}")
        pr = variant_pricing(product, variant)
        primary = next((im for im in product.get("images", []) if im.get("role") == "primary"),
                       (product.get("images") or [{}])[0] if product.get("images") else {})
        line_total = round(pr["price"] * qty, 2)
        subtotal += line_total
        lines.append({
            "product_id": product["_id"],
            "variant_id": variant["id"],
            "sku": variant.get("sku"),
            "name": product["name"],
            "slug": product.get("slug"),
            "size": variant.get("size"),
            "color": variant.get("color"),
            "color_hex": variant.get("color_hex"),
            "image": primary.get("url"),
            "price": pr["price"],
            "compare_at": pr["compare_at"],
            "qty": qty,
            "line_total": line_total,
        })
    return lines, round(subtotal, 2)


async def validate_coupon(code, subtotal, customer_email=None):
    if not code:
        return None, 0.0
    coupon = await db.coupons.find_one({"code": code.upper().strip()})
    if not coupon or not coupon.get("active", True):
        raise HTTPException(400, "Cupom inválido")
    current = now()
    if coupon.get("starts_at") and current < coupon["starts_at"]:
        raise HTTPException(400, "Cupom ainda não está válido")
    if coupon.get("ends_at") and current > coupon["ends_at"]:
        raise HTTPException(400, "Cupom expirado")
    if subtotal < float(coupon.get("min_subtotal", 0) or 0):
        raise HTTPException(400, f"Valor mínimo de R$ {coupon.get('min_subtotal')} para este cupom")
    if coupon.get("usage_limit") and coupon.get("used_count", 0) >= coupon["usage_limit"]:
        raise HTTPException(400, "Cupom esgotado")
    if coupon.get("type") == "percent":
        discount = subtotal * float(coupon["value"]) / 100.0
    else:
        discount = float(coupon["value"])
    discount = round(min(discount, subtotal), 2)
    return coupon, discount


def shipping_options(subtotal):
    opts = []
    for code, m in SHIPPING_METHODS.items():
        price = 0.0 if subtotal >= FREE_SHIPPING_THRESHOLD else m["price"]
        opts.append({"code": code, "label": m["label"], "price": price, "eta": m["eta"],
                     "free": price == 0.0})
    return opts


def shipping_price(method, subtotal):
    m = SHIPPING_METHODS.get(method)
    if not m:
        raise HTTPException(400, "Método de entrega inválido")
    return 0.0 if subtotal >= FREE_SHIPPING_THRESHOLD else m["price"]


async def quote(items, coupon_code=None, shipping_method=None, customer_email=None):
    lines, subtotal = await build_line_items(items)
    coupon, discount = await validate_coupon(coupon_code, subtotal, customer_email)
    ship_opts = shipping_options(subtotal)
    ship = 0.0
    if shipping_method:
        ship = shipping_price(shipping_method, subtotal)
    total = round(subtotal - discount + ship, 2)
    return {
        "items": lines,
        "subtotal": subtotal,
        "discount": discount,
        "coupon": coupon_code.upper() if (coupon and coupon_code) else None,
        "shipping": ship,
        "shipping_method": shipping_method,
        "shipping_options": ship_opts,
        "total": max(total, 0.0),
    }


async def create_order(payload, user=None):
    items = payload["items"]
    lines, subtotal = await build_line_items(items)
    coupon, discount = await validate_coupon(payload.get("coupon_code"), subtotal,
                                             payload.get("customer", {}).get("email"))
    ship = shipping_price(payload["shipping_method"], subtotal)
    total = round(max(subtotal - discount + ship, 0.0), 2)
    number = await next_sequence("order")
    order_number = f"FMR-{100000 + number}"
    order_doc = {
        "_id": __import__("uuid").uuid4().hex,
        "number": order_number,
        "user_id": user.get("id") if user else None,
        "customer": payload["customer"],
        "address": payload["address"],
        "items": lines,
        "subtotal": subtotal,
        "discount": discount,
        "coupon": payload.get("coupon_code", "").upper() if payload.get("coupon_code") else None,
        "shipping": ship,
        "shipping_method": payload["shipping_method"],
        "total": total,
        "status": "aguardando_pagamento",
        "payment_status": "pending",
        "timeline": [{"status": "aguardando_pagamento", "at": now().isoformat()}],
        "created_at": now(),
        "updated_at": now(),
    }
    # reserve stock
    reserve_payload = [{"product_id": l["product_id"], "variant_id": l["variant_id"], "qty": l["qty"]} for l in lines]
    await inventory.reserve_items(reserve_payload, order_doc["_id"], user.get("id") if user else None)
    await db.orders.insert_one(order_doc)
    if coupon:
        await db.coupons.update_one({"_id": coupon["_id"]}, {"$inc": {"used_count": 1}})
    return order_doc


async def finalize_paid(order_id):
    order = await db.orders.find_one({"_id": order_id})
    if not order or order.get("payment_status") == "paid":
        return
    items = [{"product_id": l["product_id"], "variant_id": l["variant_id"], "qty": l["qty"]} for l in order["items"]]
    await inventory.commit_sale(items, order_id, order.get("user_id"))
    await db.orders.update_one(
        {"_id": order_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"payment_status": "paid", "status": "pagamento_aprovado", "updated_at": now()},
         "$push": {"timeline": {"status": "pagamento_aprovado", "at": now().isoformat()}}},
    )


async def cancel_order(order_id, reason="Cancelado"):
    order = await db.orders.find_one({"_id": order_id})
    if not order or order.get("status") in ("cancelado", "entregue"):
        return
    if order.get("payment_status") != "paid":
        items = [{"product_id": l["product_id"], "variant_id": l["variant_id"], "qty": l["qty"]} for l in order["items"]]
        await inventory.release_items(items, order_id, order.get("user_id"), reason)
    await db.orders.update_one(
        {"_id": order_id},
        {"$set": {"status": "cancelado", "updated_at": now()},
         "$push": {"timeline": {"status": "cancelado", "at": now().isoformat()}}},
    )
