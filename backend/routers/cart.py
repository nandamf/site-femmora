from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from security import get_optional_user
from services import checkout

router = APIRouter(prefix="/api/cart", tags=["cart"])


class CartItem(BaseModel):
    product_id: str
    variant_id: str
    qty: int = 1


class QuoteInput(BaseModel):
    items: List[CartItem]
    coupon_code: Optional[str] = None
    shipping_method: Optional[str] = None


@router.post("/quote")
async def cart_quote(data: QuoteInput, user=Depends(get_optional_user)):
    items = [i.dict() for i in data.items]
    if not items:
        return {"items": [], "subtotal": 0, "discount": 0, "shipping": 0, "total": 0,
                "shipping_options": [], "coupon": None}
    return await checkout.quote(items, data.coupon_code, data.shipping_method,
                                user.get("email") if user else None)
