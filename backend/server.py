import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from db import db, now
from security import hash_password, verify_password
from seed import run_seed

from routers import auth, catalog, cart, orders, payments, wishlist, account, admin

app = FastAPI(title="Femmora API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "femmora"}


app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(wishlist.router)
app.include_router(account.router)
app.include_router(admin.router)


async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@femmora.com")
    password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({"email": email, "password_hash": hash_password(password),
                                   "name": "Administrador", "role": "admin", "created_at": now()})


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.products.create_index("slug")
    await db.products.create_index("category_slug")
    await db.products.create_index("status")
    await db.orders.create_index("user_id")
    await db.orders.create_index("number")
    await db.inventory_movements.create_index("product_id")
    await seed_admin()
    if os.environ.get("SEED_DEMO_DATA", "false").lower() == "true":
        await run_seed()
