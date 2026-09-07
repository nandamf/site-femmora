import os
import secrets
from datetime import timedelta
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from db import db, now, serialize
from security import (hash_password, verify_password, create_access_token, create_refresh_token,
                      set_auth_cookies, clear_auth_cookies, get_current_user,
                      check_lockout, register_failed_attempt, clear_attempts, get_jwt_secret)
from services.email import send_password_reset_email
import jwt

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ForgotInput(BaseModel):
    email: EmailStr


class ResetInput(BaseModel):
    token: str
    password: str = Field(min_length=6, max_length=128)


def _public_user(user):
    return {"id": str(user["_id"]), "name": user.get("name"), "email": user["email"],
            "role": user.get("role", "customer")}


@router.post("/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "E-mail já cadastrado")
    doc = {"name": data.name.strip(), "email": email,
           "password_hash": hash_password(data.password), "role": "customer",
           "created_at": now()}
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    uid = str(res.inserted_id)
    set_auth_cookies(response, create_access_token(uid, email, "customer"), create_refresh_token(uid))
    return _public_user(doc)


@router.post("/login")
async def login(data: LoginInput, request: Request, response: Response):
    email = data.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    await check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        await register_failed_attempt(identifier)
        raise HTTPException(401, "E-mail ou senha inválidos")
    await clear_attempts(identifier)
    uid = str(user["_id"])
    set_auth_cookies(response, create_access_token(uid, email, user.get("role", "customer")),
                     create_refresh_token(uid))
    return _public_user(user)


@router.post("/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"success": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "name": user.get("name"), "email": user["email"],
            "role": user.get("role", "customer")}


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(401, "Sem token de atualização")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Token inválido")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")
    from db import oid
    user = await db.users.find_one({"_id": oid(payload["sub"])})
    if not user:
        raise HTTPException(401, "Usuário não encontrado")
    uid = str(user["_id"])
    set_auth_cookies(response, create_access_token(uid, user["email"], user.get("role", "customer")),
                     create_refresh_token(uid))
    return {"success": True}


@router.post("/forgot-password")
async def forgot_password(data: ForgotInput):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token, "user_id": str(user["_id"]),
            "expires_at": now() + timedelta(hours=1), "used": False, "created_at": now()})
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        reset_link = f"{frontend_url}/reset-password?token={token}"
        await send_password_reset_email(email, reset_link)
    return {"success": True, "message": "Se o e-mail existir, enviaremos as instruções."}


@router.post("/reset-password")
async def reset_password(data: ResetInput):
    rec = await db.password_reset_tokens.find_one({"token": data.token})
    if not rec or rec.get("used") or rec["expires_at"] < now():
        raise HTTPException(400, "Token inválido ou expirado")
    from db import oid
    await db.users.update_one({"_id": oid(rec["user_id"])},
                              {"$set": {"password_hash": hash_password(data.password)}})
    await db.password_reset_tokens.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    return {"success": True}
