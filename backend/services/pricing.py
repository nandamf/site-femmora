"""Server-side price/promotion logic. Frontend prices are never trusted."""
from db import now
from datetime import datetime


def _within_promo_window(product) -> bool:
    starts = product.get("promo_starts_at")
    ends = product.get("promo_ends_at")
    current = now()
    if starts and isinstance(starts, datetime) and current < starts:
        return False
    if ends and isinstance(ends, datetime) and current > ends:
        return False
    return True


def variant_available(variant) -> int:
    return max(0, int(variant.get("on_hand", 0)) - int(variant.get("reserved", 0)))


def variant_pricing(product, variant) -> dict:
    """Return {price, compare_at, on_sale} for a variant, honoring promo window."""
    price = float(variant.get("price") if variant.get("price") is not None else product.get("price", 0))
    compare = variant.get("compare_at_price")
    if compare is None:
        compare = product.get("compare_at_price")
    on_sale = False
    if compare is not None and float(compare) > price and _within_promo_window(product):
        on_sale = True
    else:
        compare = None
    return {"price": round(price, 2), "compare_at": round(float(compare), 2) if compare else None, "on_sale": on_sale}


def installment_text(price: float, max_parts: int = 6) -> dict:
    """Simple interest-free installment display."""
    if price < 60:
        return {"parts": 1, "value": round(price, 2)}
    parts = min(max_parts, int(price // 30) or 1)
    parts = max(2, min(parts, max_parts))
    return {"parts": parts, "value": round(price / parts, 2)}


def compute_product_public(product: dict) -> dict:
    """Build the public/catalog representation of a product with computed price/stock badges."""
    variants = product.get("variants", []) or []
    prices = []
    total_available = 0
    any_sale = False
    sizes = []
    colors = {}
    for v in variants:
        pr = variant_pricing(product, v)
        prices.append(pr["price"])
        if pr["on_sale"]:
            any_sale = True
        avail = variant_available(v)
        total_available += avail
        if v.get("size") and v["size"] not in sizes:
            sizes.append(v["size"])
        c = v.get("color")
        if c and c not in colors:
            colors[c] = v.get("color_hex", "#cccccc")
    min_price = min(prices) if prices else float(product.get("price", 0))
    max_price = max(prices) if prices else float(product.get("price", 0))
    base_pricing = variant_pricing(product, {}) if not variants else None
    compare_at = None
    if variants:
        cmps = [variant_pricing(product, v)["compare_at"] for v in variants]
        cmps = [c for c in cmps if c]
        compare_at = max(cmps) if cmps else None
    else:
        compare_at = base_pricing["compare_at"] if base_pricing else None
        any_sale = base_pricing["on_sale"] if base_pricing else False

    low_stock = 0 < total_available <= int(product.get("low_stock_threshold", 5) or 5)
    return {
        "min_price": round(min_price, 2),
        "max_price": round(max_price, 2),
        "compare_at_price": compare_at,
        "on_sale": any_sale,
        "in_stock": total_available > 0,
        "total_available": total_available,
        "low_stock": low_stock,
        "installment": installment_text(min_price),
        "sizes": sizes,
        "colors": [{"name": k, "hex": v} for k, v in colors.items()],
    }
