from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from db import db, now, oid, serialize
from security import get_current_user

router = APIRouter(prefix="/api/account", tags=["account"])


class ProfileInput(BaseModel):
    name: str
    phone: Optional[str] = None


class Address(BaseModel):
    label: Optional[str] = "Endereço"
    cep: str
    street: str
    number: str
    complement: Optional[str] = ""
    district: str
    city: str
    state: str


@router.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    doc = await db.users.find_one({"_id": oid(user["id"])})
    return {"id": user["id"], "name": doc.get("name"), "email": doc["email"],
            "phone": doc.get("phone"), "role": doc.get("role", "customer")}


@router.put("/profile")
async def update_profile(data: ProfileInput, user=Depends(get_current_user)):
    await db.users.update_one({"_id": oid(user["id"])},
                              {"$set": {"name": data.name, "phone": data.phone, "updated_at": now()}})
    return {"success": True}


@router.get("/addresses")
async def list_addresses(user=Depends(get_current_user)):
    doc = await db.users.find_one({"_id": oid(user["id"])})
    return doc.get("addresses", []) if doc else []


@router.post("/addresses")
async def add_address(data: Address, user=Depends(get_current_user)):
    addr = data.dict()
    addr["id"] = __import__("uuid").uuid4().hex
    await db.users.update_one({"_id": oid(user["id"])}, {"$push": {"addresses": addr}})
    return addr


@router.delete("/addresses/{addr_id}")
async def delete_address(addr_id: str, user=Depends(get_current_user)):
    await db.users.update_one({"_id": oid(user["id"])},
                              {"$pull": {"addresses": {"id": addr_id}}})
    return {"success": True}


@router.delete("/data")
async def request_data_deletion(user=Depends(get_current_user)):
    """LGPD: registrar solicitação de exclusão de dados."""
    await db.data_requests.insert_one({"user_id": user["id"], "email": user["email"],
                                       "type": "deletion", "status": "requested", "created_at": now()})
    return {"success": True, "message": "Solicitação de exclusão registrada. Nossa equipe entrará em contato."}
