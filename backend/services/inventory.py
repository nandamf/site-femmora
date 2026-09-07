"""Inventory reservation, sale commit and movement history. Never allows negative stock."""
from fastapi import HTTPException
from db import db, now
from services.pricing import variant_available


async def record_movement(variant_id, product_id, sku, movement_type, qty_delta,
                          reservation_delta, balance_on_hand, balance_reserved,
                          reference_type=None, reference_id=None, reason=None, user_id=None):
    await db.inventory_movements.insert_one({
        "variant_id": variant_id,
        "product_id": product_id,
        "sku": sku,
        "movement_type": movement_type,
        "quantity_delta": qty_delta,
        "reservation_delta": reservation_delta,
        "balance_on_hand": balance_on_hand,
        "balance_reserved": balance_reserved,
        "reference_type": reference_type,
        "reference_id": reference_id,
        "reason": reason,
        "created_by": user_id,
        "created_at": now(),
    })


def _find_variant(product, variant_id):
    for v in product.get("variants", []):
        if v.get("id") == variant_id:
            return v
    return None


async def reserve_items(items, order_id, user_id=None):
    """items: [{product_id, variant_id, qty}]. Atomically reserves stock. Rolls back on failure."""
    reserved = []
    try:
        for it in items:
            product = await db.products.find_one({"_id": it["product_id"]})
            if not product:
                raise HTTPException(400, f"Produto não encontrado: {it['product_id']}")
            variant = _find_variant(product, it["variant_id"])
            if not variant:
                raise HTTPException(400, "Variação não encontrada")
            avail = variant_available(variant)
            qty = int(it["qty"])
            if qty <= 0:
                raise HTTPException(400, "Quantidade inválida")
            if avail < qty:
                raise HTTPException(409, f"Estoque insuficiente para {product['name']} ({variant.get('size','')}/{variant.get('color','')})")
            on_hand = int(variant.get("on_hand", 0))
            res = await db.products.update_one(
                {"_id": it["product_id"]},
                {"$inc": {"variants.$[v].reserved": qty}},
                array_filters=[{"v.id": it["variant_id"], "v.reserved": {"$lte": on_hand - qty}}],
            )
            if res.modified_count == 0:
                raise HTTPException(409, f"Estoque insuficiente para {product['name']}")
            reserved.append((it, variant, on_hand))
            await record_movement(it["variant_id"], it["product_id"], variant.get("sku"),
                                  "reservation", 0, qty, on_hand,
                                  int(variant.get("reserved", 0)) + qty,
                                  "order", order_id, "Reserva no checkout", user_id)
        return True
    except Exception:
        # rollback reservations already made
        for it, variant, _ in reserved:
            await db.products.update_one(
                {"_id": it["product_id"]},
                {"$inc": {"variants.$[v].reserved": -int(it["qty"])}},
                array_filters=[{"v.id": it["variant_id"]}],
            )
        raise


async def release_items(items, order_id, user_id=None, reason="Cancelamento"):
    for it in items:
        await db.products.update_one(
            {"_id": it["product_id"]},
            {"$inc": {"variants.$[v].reserved": -int(it["qty"])}},
            array_filters=[{"v.id": it["variant_id"], "v.reserved": {"$gte": int(it["qty"])}}],
        )
        product = await db.products.find_one({"_id": it["product_id"]})
        variant = _find_variant(product, it["variant_id"]) if product else None
        if variant:
            await record_movement(it["variant_id"], it["product_id"], variant.get("sku"),
                                  "release", 0, -int(it["qty"]), int(variant.get("on_hand", 0)),
                                  int(variant.get("reserved", 0)), "order", order_id, reason, user_id)


async def commit_sale(items, order_id, user_id=None):
    """Convert reservation to sale: decrement on_hand and reserved."""
    for it in items:
        qty = int(it["qty"])
        await db.products.update_one(
            {"_id": it["product_id"]},
            {"$inc": {"variants.$[v].on_hand": -qty, "variants.$[v].reserved": -qty}},
            array_filters=[{"v.id": it["variant_id"]}],
        )
        product = await db.products.find_one({"_id": it["product_id"]})
        variant = _find_variant(product, it["variant_id"]) if product else None
        if variant:
            await record_movement(it["variant_id"], it["product_id"], variant.get("sku"),
                                  "sale", -qty, -qty, int(variant.get("on_hand", 0)),
                                  int(variant.get("reserved", 0)), "order", order_id, "Venda confirmada", user_id)


async def adjust_stock(product_id, variant_id, new_on_hand, user_id, reason="Ajuste manual"):
    product = await db.products.find_one({"_id": product_id})
    if not product:
        raise HTTPException(404, "Produto não encontrado")
    variant = _find_variant(product, variant_id)
    if not variant:
        raise HTTPException(404, "Variação não encontrada")
    reserved = int(variant.get("reserved", 0))
    new_on_hand = int(new_on_hand)
    if new_on_hand < reserved:
        raise HTTPException(400, "Estoque não pode ser menor que o reservado")
    old = int(variant.get("on_hand", 0))
    await db.products.update_one(
        {"_id": product_id},
        {"$set": {"variants.$[v].on_hand": new_on_hand}},
        array_filters=[{"v.id": variant_id}],
    )
    await record_movement(variant_id, product_id, variant.get("sku"),
                          "adjustment", new_on_hand - old, 0, new_on_hand, reserved,
                          "manual", None, reason, user_id)
    return {"old": old, "new": new_on_hand}
