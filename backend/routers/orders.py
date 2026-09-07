from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from db import db, serialize
from security import get_optional_user, get_current_user
from services import checkout

router = APIRouter(prefix="/api/orders", tags=["orders"])


class ItemInput(BaseModel):
    product_id: str
    variant_id: str
    qty: int = 1


class CustomerInput(BaseModel):
    name: str
    email: EmailStr
    phone: str


class AddressInput(BaseModel):
    cep: str
    street: str
    number: str
    complement: Optional[str] = ""
    district: str
    city: str
    state: str


class CheckoutInput(BaseModel):
    items: List[ItemInput]
    customer: CustomerInput
    address: AddressInput
    shipping_method: str
    coupon_code: Optional[str] = None


@router.post("/checkout")
async def checkout_order(data: CheckoutInput, user=Depends(get_optional_user)):
    if not data.items:
        raise HTTPException(400, "Carrinho vazio")
    payload = {
        "items": [i.dict() for i in data.items],
        "customer": data.customer.dict(),
        "address": data.address.dict(),
        "shipping_method": data.shipping_method,
        "coupon_code": data.coupon_code,
    }
    order = await checkout.create_order(payload, user)
    return serialize(order)


@router.get("/mine")
async def my_orders(user=Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return serialize(orders)


@router.get("/{order_id}")
async def get_order(order_id: str, user=Depends(get_optional_user)):
    order = await db.orders.find_one({"_id": order_id})
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    # allow owner or guest who created (no user). Admins can see all.
    if order.get("user_id") and (not user or (user["id"] != order["user_id"] and user.get("role") != "admin")):
        raise HTTPException(403, "Acesso negado")
    return serialize(order)
