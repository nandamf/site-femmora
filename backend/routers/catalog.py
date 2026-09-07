from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from db import db, serialize
from services.pricing import compute_product_public, variant_pricing, variant_available

router = APIRouter(prefix="/api", tags=["catalog"])


def public_card(product):
    computed = compute_product_public(product)
    primary = next((im for im in product.get("images", []) if im.get("role") == "primary"), None)
    hover = next((im for im in product.get("images", []) if im.get("role") == "hover"), None)
    imgs = product.get("images", [])
    return {
        "id": product["_id"],
        "name": product["name"],
        "slug": product.get("slug"),
        "sku": product.get("sku"),
        "category": product.get("category"),
        "category_slug": product.get("category_slug"),
        "collection": product.get("collection"),
        "short_description": product.get("short_description"),
        "is_featured": product.get("is_featured", False),
        "is_new": product.get("is_new", False),
        "image": (primary or (imgs[0] if imgs else {})).get("url"),
        "hover_image": (hover or (imgs[1] if len(imgs) > 1 else {})).get("url"),
        "alt": (primary or (imgs[0] if imgs else {})).get("alt", product["name"]),
        **computed,
    }


@router.get("/categories")
async def list_categories():
    cats = await db.categories.find({"is_active": True}).sort("sort_order", 1).to_list(200)
    return serialize(cats)


@router.get("/collections")
async def list_collections():
    cols = await db.collections.find({"is_active": True}).sort("sort_order", 1).to_list(200)
    return serialize(cols)


@router.get("/products/filters")
async def product_filters():
    """Facets derived from active products."""
    products = await db.products.find({"status": "active"}).to_list(1000)
    sizes, colors, cats, collections = set(), {}, {}, {}
    max_price = 0
    for p in products:
        cat = p.get("category")
        if cat:
            cats[cat] = p.get("category_slug", cat)
        col = p.get("collection")
        if col:
            collections[col] = col
        for v in p.get("variants", []):
            if v.get("size"):
                sizes.add(v["size"])
            if v.get("color"):
                colors[v["color"]] = v.get("color_hex", "#ccc")
            pr = variant_pricing(p, v)
            max_price = max(max_price, pr["price"])
    size_order = ["PP", "P", "M", "G", "GG", "XG", "EG"]
    ordered_sizes = [s for s in size_order if s in sizes] + [s for s in sizes if s not in size_order]
    return {
        "sizes": ordered_sizes,
        "colors": [{"name": k, "hex": v} for k, v in colors.items()],
        "categories": [{"name": k, "slug": v} for k, v in cats.items()],
        "collections": list(collections.keys()),
        "max_price": round(max_price + 0.5),
    }


@router.get("/products")
async def list_products(
    category: Optional[str] = None,
    collection: Optional[str] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    availability: Optional[str] = None,
    featured: Optional[bool] = None,
    is_new: Optional[bool] = None,
    on_sale: Optional[bool] = None,
    q: Optional[str] = None,
    sort: str = "relevance",
    page: int = 1,
    limit: int = Query(24, le=60),
):
    query = {"status": "active"}
    if category:
        query["$or"] = [{"category_slug": category}, {"category": category}]
    if collection:
        query["collection"] = collection
    if featured is not None:
        query["is_featured"] = featured
    if is_new is not None:
        query["is_new"] = is_new
    if q:
        rx = {"$regex": q, "$options": "i"}
        query["$and"] = [{"$or": [{"name": rx}, {"sku": rx}, {"description": rx},
                                  {"short_description": rx}, {"category": rx},
                                  {"collection": rx}, {"tags": rx}]}]
    products = await db.products.find(query).to_list(2000)
    cards = [public_card(p) for p in products]

    # in-memory filters that depend on computed fields
    def keep(c, raw):
        if size and size not in c["sizes"]:
            return False
        if color and not any(col["name"].lower() == color.lower() for col in c["colors"]):
            return False
        if min_price is not None and c["min_price"] < min_price:
            return False
        if max_price is not None and c["min_price"] > max_price:
            return False
        if on_sale and not c["on_sale"]:
            return False
        if availability == "in_stock" and not c["in_stock"]:
            return False
        if availability == "low" and not c["low_stock"]:
            return False
        if availability == "out" and c["in_stock"]:
            return False
        return True

    cards = [c for c in cards if keep(c, None)]

    if sort == "price_asc":
        cards.sort(key=lambda c: c["min_price"])
    elif sort == "price_desc":
        cards.sort(key=lambda c: c["min_price"], reverse=True)
    elif sort == "newest":
        cards.sort(key=lambda c: c["is_new"], reverse=True)
    elif sort == "name":
        cards.sort(key=lambda c: c["name"])

    total = len(cards)
    start = (page - 1) * limit
    return {"total": total, "page": page, "limit": limit, "products": cards[start:start + limit]}


@router.get("/products/{slug}")
async def get_product(slug: str):
    product = await db.products.find_one({"slug": slug, "status": "active"})
    if not product:
        product = await db.products.find_one({"_id": slug, "status": "active"})
    if not product:
        raise HTTPException(404, "Produto não encontrado")
    computed = compute_product_public(product)
    variants = []
    for v in product.get("variants", []):
        pr = variant_pricing(product, v)
        variants.append({
            "id": v["id"], "sku": v.get("sku"), "size": v.get("size"),
            "color": v.get("color"), "color_hex": v.get("color_hex"),
            "price": pr["price"], "compare_at": pr["compare_at"], "on_sale": pr["on_sale"],
            "available": variant_available(v),
        })
    related = []
    if product.get("category"):
        rel = await db.products.find({"category": product["category"], "status": "active",
                                      "_id": {"$ne": product["_id"]}}).limit(4).to_list(4)
        related = [public_card(r) for r in rel]
    return {
        "id": product["_id"],
        "name": product["name"], "slug": product.get("slug"), "sku": product.get("sku"),
        "category": product.get("category"), "category_slug": product.get("category_slug"),
        "collection": product.get("collection"),
        "description": product.get("description"),
        "short_description": product.get("short_description"),
        "composition": product.get("composition"),
        "care": product.get("care"),
        "size_guide": product.get("size_guide", []),
        "images": product.get("images", []),
        "is_new": product.get("is_new", False),
        "installments": computed["installment"],
        "variants": variants,
        "sizes": computed["sizes"],
        "colors": computed["colors"],
        "min_price": computed["min_price"],
        "max_price": computed["max_price"],
        "compare_at_price": computed["compare_at_price"],
        "on_sale": computed["on_sale"],
        "in_stock": computed["in_stock"],
        "low_stock": computed["low_stock"],
        "total_available": computed["total_available"],
        "related": related,
        "seo_title": product.get("seo_title"),
        "seo_description": product.get("seo_description"),
    }
