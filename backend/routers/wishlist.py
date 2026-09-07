from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from db import db, now, serialize
from security import get_current_user
from routers.catalog import public_card

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


class WishInput(BaseModel):
    product_id: str


@router.get("")
async def get_wishlist(user=Depends(get_current_user)):
    wl = await db.wishlists.find_one({"user_id": user["id"]})
    ids = wl.get("product_ids", []) if wl else []
    if not ids:
        return {"product_ids": [], "products": []}
    products = await db.products.find({"_id": {"$in": ids}, "status": "active"}).to_list(200)
    return {"product_ids": ids, "products": [public_card(p) for p in products]}


@router.post("/toggle")
async def toggle_wishlist(data: WishInput, user=Depends(get_current_user)):
    wl = await db.wishlists.find_one({"user_id": user["id"]})
    ids = wl.get("product_ids", []) if wl else []
    if data.product_id in ids:
        ids.remove(data.product_id)
        active = False
    else:
        ids.append(data.product_id)
        active = True
    await db.wishlists.update_one({"user_id": user["id"]},
                                  {"$set": {"product_ids": ids, "updated_at": now()}}, upsert=True)
    return {"active": active, "product_ids": ids}
