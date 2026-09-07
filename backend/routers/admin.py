import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from slugify import slugify
from db import db, now, serialize
from security import require_admin
from services import inventory
from services.audit import log_action
from services.pricing import compute_product_public

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---------- Models ----------
class VariantInput(BaseModel):
    id: Optional[str] = None
    sku: str
    size: Optional[str] = None
    color: Optional[str] = None
    color_hex: Optional[str] = "#cccccc"
    price: Optional[float] = None
    compare_at_price: Optional[float] = None
    on_hand: int = 0
    reserved: int = 0
    low_stock_threshold: int = 5


class ImageInput(BaseModel):
    url: str
    alt: Optional[str] = ""
    role: str = "gallery"  # primary | hover | gallery
    sort_order: int = 0


class SizeGuideRow(BaseModel):
    size: str
    bust: Optional[str] = ""
    waist: Optional[str] = ""
    hips: Optional[str] = ""


class ProductInput(BaseModel):
    name: str
    slug: Optional[str] = None
    sku: str
    short_description: Optional[str] = ""
    description: Optional[str] = ""
    category: str
    category_slug: Optional[str] = None
    collection: Optional[str] = None
    tags: List[str] = []
    price: float
    compare_at_price: Optional[float] = None
    promo_starts_at: Optional[datetime] = None
    promo_ends_at: Optional[datetime] = None
    status: str = "active"
    is_featured: bool = False
    is_new: bool = False
    low_stock_threshold: int = 5
    variants: List[VariantInput] = []
    images: List[ImageInput] = []
    composition: Optional[str] = ""
    care: Optional[str] = ""
    size_guide: List[SizeGuideRow] = []
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None


def _prep_product(data: ProductInput):
    doc = data.dict()
    doc["slug"] = slugify(data.slug or data.name)
    doc["category_slug"] = slugify(data.category_slug or data.category)
    variants = []
    for v in doc["variants"]:
        v = dict(v)
        v["id"] = v.get("id") or uuid.uuid4().hex
        v["sku"] = (v.get("sku") or "").upper()
        variants.append(v)
    doc["variants"] = variants
    doc["images"] = doc.get("images", [])
    return doc


# ---------- Products ----------
@router.get("/products")
async def admin_list_products(q: Optional[str] = None, status: Optional[str] = None,
                              admin=Depends(require_admin)):
    query = {}
    if status:
        query["status"] = status
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}},
                        {"sku": {"$regex": q, "$options": "i"}}]
    products = await db.products.find(query).sort("created_at", -1).to_list(1000)
    out = []
    for p in products:
        c = compute_product_public(p)
        out.append({"id": p["_id"], "name": p["name"], "sku": p.get("sku"),
                    "category": p.get("category"), "status": p.get("status"),
                    "price": c["min_price"], "on_sale": c["on_sale"],
                    "total_available": c["total_available"], "low_stock": c["low_stock"],
                    "variant_count": len(p.get("variants", [])),
                    "image": (p.get("images") or [{}])[0].get("url")})
    return out


@router.get("/products/{product_id}")
async def admin_get_product(product_id: str, admin=Depends(require_admin)):
    p = await db.products.find_one({"_id": product_id})
    if not p:
        raise HTTPException(404, "Produto não encontrado")
    return serialize(p)


@router.post("/products")
async def admin_create_product(data: ProductInput, admin=Depends(require_admin)):
    doc = _prep_product(data)
    if await db.products.find_one({"slug": doc["slug"]}):
        doc["slug"] = f"{doc['slug']}-{uuid.uuid4().hex[:5]}"
    doc["_id"] = uuid.uuid4().hex
    doc["created_at"] = now()
    doc["updated_at"] = now()
    await db.products.insert_one(doc)
    # initial stock movements
    for v in doc["variants"]:
        if int(v.get("on_hand", 0)) > 0:
            await inventory.record_movement(v["id"], doc["_id"], v["sku"], "initial",
                                            int(v["on_hand"]), 0, int(v["on_hand"]),
                                            int(v.get("reserved", 0)), "product", doc["_id"],
                                            "Estoque inicial", admin["id"])
    await log_action(admin, "product.create", "product", doc["_id"], f"Produto criado: {doc['name']}")
    return serialize(doc)


@router.put("/products/{product_id}")
async def admin_update_product(product_id: str, data: ProductInput, admin=Depends(require_admin)):
    existing = await db.products.find_one({"_id": product_id})
    if not existing:
        raise HTTPException(404, "Produto não encontrado")
    doc = _prep_product(data)
    # preserve reserved counts from existing variants (never trust client reserved)
    existing_by_id = {v["id"]: v for v in existing.get("variants", [])}
    for v in doc["variants"]:
        if v["id"] in existing_by_id:
            v["reserved"] = existing_by_id[v["id"]].get("reserved", 0)
        else:
            v["reserved"] = 0
    doc["updated_at"] = now()
    await db.products.update_one({"_id": product_id}, {"$set": doc})
    await log_action(admin, "product.update", "product", product_id, f"Produto atualizado: {doc['name']}")
    updated = await db.products.find_one({"_id": product_id})
    return serialize(updated)


@router.delete("/products/{product_id}")
async def admin_delete_product(product_id: str, admin=Depends(require_admin)):
    p = await db.products.find_one({"_id": product_id})
    if not p:
        raise HTTPException(404, "Produto não encontrado")
    await db.products.update_one({"_id": product_id}, {"$set": {"status": "archived", "updated_at": now()}})
    await log_action(admin, "product.archive", "product", product_id, f"Produto arquivado: {p['name']}")
    return {"success": True}


# ---------- Inventory ----------
class StockAdjust(BaseModel):
    product_id: str
    variant_id: str
    new_on_hand: int
    reason: Optional[str] = "Ajuste manual"


@router.post("/inventory/adjust")
async def admin_adjust_stock(data: StockAdjust, admin=Depends(require_admin)):
    res = await inventory.adjust_stock(data.product_id, data.variant_id, data.new_on_hand,
                                       admin["id"], data.reason)
    await log_action(admin, "inventory.adjust", "variant", data.variant_id,
                     f"Estoque ajustado de {res['old']} para {res['new']}")
    return res


@router.get("/inventory/movements")
async def admin_movements(product_id: Optional[str] = None, limit: int = Query(100, le=500),
                          admin=Depends(require_admin)):
    query = {}
    if product_id:
        query["product_id"] = product_id
    movs = await db.inventory_movements.find(query).sort("created_at", -1).to_list(limit)
    return serialize(movs)


@router.get("/inventory/alerts")
async def admin_stock_alerts(admin=Depends(require_admin)):
    products = await db.products.find({"status": "active"}).to_list(1000)
    low, out = [], []
    for p in products:
        for v in p.get("variants", []):
            avail = int(v.get("on_hand", 0)) - int(v.get("reserved", 0))
            row = {"product_id": p["_id"], "name": p["name"], "sku": v.get("sku"),
                   "size": v.get("size"), "color": v.get("color"), "available": avail}
            if avail <= 0:
                out.append(row)
            elif avail <= int(v.get("low_stock_threshold", 5) or 5):
                low.append(row)
    return {"low_stock": low, "out_of_stock": out}


# ---------- Categories & Collections ----------
class CategoryInput(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = ""
    image: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


@router.post("/categories")
async def admin_create_category(data: CategoryInput, admin=Depends(require_admin)):
    doc = data.dict()
    doc["slug"] = slugify(data.slug or data.name)
    doc["_id"] = uuid.uuid4().hex
    doc["created_at"] = now()
    await db.categories.insert_one(doc)
    await log_action(admin, "category.create", "category", doc["_id"], f"Categoria criada: {doc['name']}")
    return serialize(doc)


@router.put("/categories/{cat_id}")
async def admin_update_category(cat_id: str, data: CategoryInput, admin=Depends(require_admin)):
    doc = data.dict()
    doc["slug"] = slugify(data.slug or data.name)
    await db.categories.update_one({"_id": cat_id}, {"$set": doc})
    return {"success": True}


@router.delete("/categories/{cat_id}")
async def admin_delete_category(cat_id: str, admin=Depends(require_admin)):
    await db.categories.delete_one({"_id": cat_id})
    return {"success": True}


class CollectionInput(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = ""
    is_active: bool = True
    sort_order: int = 0


@router.post("/collections")
async def admin_create_collection(data: CollectionInput, admin=Depends(require_admin)):
    doc = data.dict()
    doc["slug"] = slugify(data.slug or data.name)
    doc["_id"] = uuid.uuid4().hex
    doc["created_at"] = now()
    await db.collections.insert_one(doc)
    return serialize(doc)


@router.delete("/collections/{col_id}")
async def admin_delete_collection(col_id: str, admin=Depends(require_admin)):
    await db.collections.delete_one({"_id": col_id})
    return {"success": True}


# ---------- Coupons ----------
class CouponInput(BaseModel):
    code: str
    type: str = "percent"  # percent | fixed
    value: float
    active: bool = True
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    min_subtotal: float = 0
    usage_limit: Optional[int] = None
    per_customer_limit: Optional[int] = None


@router.get("/coupons")
async def admin_list_coupons(admin=Depends(require_admin)):
    return serialize(await db.coupons.find().sort("created_at", -1).to_list(200))


@router.post("/coupons")
async def admin_create_coupon(data: CouponInput, admin=Depends(require_admin)):
    doc = data.dict()
    doc["code"] = data.code.upper().strip()
    if await db.coupons.find_one({"code": doc["code"]}):
        raise HTTPException(400, "Código de cupom já existe")
    doc["_id"] = uuid.uuid4().hex
    doc["used_count"] = 0
    doc["created_at"] = now()
    await db.coupons.insert_one(doc)
    await log_action(admin, "coupon.create", "coupon", doc["_id"], f"Cupom criado: {doc['code']}")
    return serialize(doc)


@router.delete("/coupons/{coupon_id}")
async def admin_delete_coupon(coupon_id: str, admin=Depends(require_admin)):
    await db.coupons.delete_one({"_id": coupon_id})
    return {"success": True}


# ---------- Orders ----------
ORDER_STATUSES = ["aguardando_pagamento", "pagamento_aprovado", "em_preparacao",
                  "enviado", "entregue", "cancelado", "devolvido"]


class OrderStatusInput(BaseModel):
    status: str


@router.get("/orders")
async def admin_list_orders(status: Optional[str] = None, admin=Depends(require_admin)):
    query = {}
    if status:
        query["status"] = status
    orders = await db.orders.find(query).sort("created_at", -1).to_list(500)
    return serialize(orders)


@router.get("/orders/{order_id}")
async def admin_get_order(order_id: str, admin=Depends(require_admin)):
    o = await db.orders.find_one({"_id": order_id})
    if not o:
        raise HTTPException(404, "Pedido não encontrado")
    return serialize(o)


@router.put("/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, data: OrderStatusInput, admin=Depends(require_admin)):
    if data.status not in ORDER_STATUSES:
        raise HTTPException(400, "Status inválido")
    order = await db.orders.find_one({"_id": order_id})
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    if data.status == "cancelado":
        from services import checkout
        await checkout.cancel_order(order_id, "Cancelado pelo administrador")
    else:
        await db.orders.update_one({"_id": order_id},
            {"$set": {"status": data.status, "updated_at": now()},
             "$push": {"timeline": {"status": data.status, "at": now().isoformat()}}})
    await log_action(admin, "order.status", "order", order_id,
                     f"Status do pedido {order['number']} alterado para {data.status}")
    return {"success": True}


# ---------- Customers ----------
@router.get("/customers")
async def admin_customers(admin=Depends(require_admin)):
    users = await db.users.find({"role": "customer"}).sort("created_at", -1).to_list(1000)
    out = []
    for u in users:
        uid = str(u["_id"])
        orders = await db.orders.find({"user_id": uid, "payment_status": "paid"}).to_list(500)
        total = sum(float(o["total"]) for o in orders)
        last = orders[0]["created_at"] if orders else None
        out.append({"id": uid, "name": u.get("name"), "email": u["email"],
                    "phone": u.get("phone"), "created_at": serialize(u.get("created_at")),
                    "orders_count": len(orders), "total_spent": round(total, 2),
                    "last_order": serialize(last)})
    return out


# ---------- Dashboard / Reports ----------
@router.get("/dashboard")
async def admin_dashboard(admin=Depends(require_admin)):
    paid = await db.orders.find({"payment_status": "paid"}).to_list(5000)
    revenue = sum(float(o["total"]) for o in paid)
    orders_count = await db.orders.count_documents({})
    paid_count = len(paid)
    avg_ticket = round(revenue / paid_count, 2) if paid_count else 0
    customers = await db.users.count_documents({"role": "customer"})

    size_sales, color_sales, product_sales = {}, {}, {}
    for o in paid:
        for it in o.get("items", []):
            if it.get("size"):
                size_sales[it["size"]] = size_sales.get(it["size"], 0) + it["qty"]
            if it.get("color"):
                color_sales[it["color"]] = color_sales.get(it["color"], 0) + it["qty"]
            key = it["name"]
            product_sales[key] = product_sales.get(key, 0) + it["qty"]

    def top(d, n=6):
        return sorted([{"label": k, "value": v} for k, v in d.items()],
                      key=lambda x: x["value"], reverse=True)[:n]

    alerts = await admin_stock_alerts(admin)
    return {
        "revenue": round(revenue, 2),
        "orders_count": orders_count,
        "paid_count": paid_count,
        "avg_ticket": avg_ticket,
        "customers": customers,
        "top_products": top(product_sales),
        "top_sizes": top(size_sales),
        "top_colors": top(color_sales),
        "low_stock_count": len(alerts["low_stock"]),
        "out_of_stock_count": len(alerts["out_of_stock"]),
        "recent_orders": serialize(await db.orders.find().sort("created_at", -1).to_list(8)),
    }


@router.get("/audit-logs")
async def admin_audit_logs(limit: int = Query(100, le=500), admin=Depends(require_admin)):
    return serialize(await db.audit_logs.find().sort("created_at", -1).to_list(limit))
