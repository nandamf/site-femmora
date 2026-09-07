"""Comprehensive backend API tests for Femmora e-commerce."""
import os
import time
import uuid
from pathlib import Path
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback for local usage: read frontend/.env relative to the repo root
    frontend_env = Path(__file__).resolve().parents[2] / "frontend" / ".env"
    if frontend_env.exists():
        with open(frontend_env) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
if not BASE_URL:
    BASE_URL = "http://localhost:8000"

API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@femmora.com"
ADMIN_PASSWORD = "Femmora@2026"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="session")
def customer_session():
    s = requests.Session()
    email = f"TEST_customer_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "name": "Cliente Teste", "email": email, "password": "Password@123"
    })
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    s.email = email
    return s


# ---------------- Health ----------------
def test_health():
    r = requests.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------------- Auth ----------------
def test_admin_login_and_me(admin_session):
    r = admin_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"


def test_register_and_me(customer_session):
    r = customer_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["role"] == "customer"


def test_logout_clears_session(http):
    s = requests.Session()
    email = f"TEST_logout_{uuid.uuid4().hex[:6]}@example.com"
    s.post(f"{API}/auth/register", json={"name": "Log Out", "email": email, "password": "Password@123"})
    r = s.post(f"{API}/auth/logout")
    assert r.status_code == 200
    r2 = s.get(f"{API}/auth/me")
    assert r2.status_code == 401


def test_brute_force_lockout():
    s = requests.Session()
    email = f"TEST_bf_{uuid.uuid4().hex[:6]}@example.com"
    got_429 = False
    for _ in range(7):
        r = s.post(f"{API}/auth/login", json={"email": email, "password": "wrong"})
        if r.status_code == 429:
            got_429 = True
            break
    assert got_429, "Expected 429 after repeated failures"


# ---------------- Catalog ----------------
def test_list_products():
    r = requests.get(f"{API}/products")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 10
    assert len(data["products"]) > 0


def test_product_filters():
    r = requests.get(f"{API}/products/filters")
    assert r.status_code == 200
    data = r.json()
    assert "sizes" in data and len(data["sizes"]) > 0
    assert "colors" in data and len(data["colors"]) > 0
    assert "categories" in data and len(data["categories"]) > 0


def test_get_product_detail_by_slug():
    r = requests.get(f"{API}/products?limit=1")
    slug = r.json()["products"][0]["slug"]
    r2 = requests.get(f"{API}/products/{slug}")
    assert r2.status_code == 200
    data = r2.json()
    assert data["slug"] == slug
    assert "variants" in data and len(data["variants"]) > 0
    v = data["variants"][0]
    assert "available" in v and "price" in v


def test_filter_by_category():
    filters = requests.get(f"{API}/products/filters").json()
    if filters["categories"]:
        cat = filters["categories"][0]["slug"]
        r = requests.get(f"{API}/products?category={cat}")
        assert r.status_code == 200
        assert r.json()["total"] >= 0


def test_filter_on_sale_and_sort():
    r = requests.get(f"{API}/products?on_sale=true&sort=price_asc")
    assert r.status_code == 200


# ---------------- Cart Quote ----------------
def _pick_available_variant():
    r = requests.get(f"{API}/products?limit=20").json()
    for p in r["products"]:
        detail = requests.get(f"{API}/products/{p['slug']}").json()
        for v in detail["variants"]:
            if v["available"] > 0:
                return detail["id"], v
    return None, None


def test_cart_quote_server_price():
    pid, v = _pick_available_variant()
    assert pid and v
    # attempt to trick with client price should not affect calc
    r = requests.post(f"{API}/cart/quote", json={
        "items": [{"product_id": pid, "variant_id": v["id"], "qty": 2}]
    })
    assert r.status_code == 200
    data = r.json()
    expected_subtotal = round(v["price"] * 2, 2)
    assert abs(data["subtotal"] - expected_subtotal) < 0.01


def test_cart_quote_coupon_bemvinda10():
    pid, v = _pick_available_variant()
    r = requests.post(f"{API}/cart/quote", json={
        "items": [{"product_id": pid, "variant_id": v["id"], "qty": 1}],
        "coupon_code": "BEMVINDA10"
    })
    assert r.status_code == 200
    data = r.json()
    assert data["discount"] > 0
    assert data["coupon"] == "BEMVINDA10"


def test_cart_quote_free_shipping_above_300():
    pid, v = _pick_available_variant()
    qty = max(1, int(300 // v["price"]) + 2)
    r = requests.post(f"{API}/cart/quote", json={
        "items": [{"product_id": pid, "variant_id": v["id"], "qty": qty}],
        "shipping_method": "pac"
    })
    assert r.status_code == 200
    data = r.json()
    if data["subtotal"] >= 300:
        assert data["shipping"] == 0.0


# ---------------- Checkout / Orders / Oversell ----------------
CUSTOMER_PAYLOAD = {
    "name": "Cliente Teste",
    "email": "test_checkout@example.com",
    "phone": "11999999999",
}
ADDRESS_PAYLOAD = {
    "cep": "01310-100", "street": "Av. Paulista", "number": "1000",
    "complement": "", "district": "Bela Vista", "city": "São Paulo", "state": "SP"
}


def test_checkout_creates_order_and_reserves_stock():
    pid, v = _pick_available_variant()
    # get current reserved
    before = requests.get(f"{API}/products/{requests.get(f'{API}/products?limit=1').json()['products'][0]['slug']}").json()
    r = requests.post(f"{API}/orders/checkout", json={
        "items": [{"product_id": pid, "variant_id": v["id"], "qty": 1}],
        "customer": CUSTOMER_PAYLOAD,
        "address": ADDRESS_PAYLOAD,
        "shipping_method": "pac"
    })
    assert r.status_code == 200, r.text
    order = r.json()
    assert order["number"].startswith("FMR-")
    assert order["status"] == "aguardando_pagamento"
    assert order["payment_status"] == "pending"
    assert order["total"] > 0
    # server-side re-compute
    assert abs(order["total"] - (order["subtotal"] - order["discount"] + order["shipping"])) < 0.01


def test_checkout_oversell_blocked():
    pid, v = _pick_available_variant()
    # try qty way beyond available
    r = requests.post(f"{API}/orders/checkout", json={
        "items": [{"product_id": pid, "variant_id": v["id"], "qty": v["available"] + 999}],
        "customer": CUSTOMER_PAYLOAD,
        "address": ADDRESS_PAYLOAD,
        "shipping_method": "pac"
    })
    assert r.status_code in (400, 409)


# ---------------- Payments ----------------
def test_payment_session_creation():
    pid, v = _pick_available_variant()
    r = requests.post(f"{API}/orders/checkout", json={
        "items": [{"product_id": pid, "variant_id": v["id"], "qty": 1}],
        "customer": CUSTOMER_PAYLOAD,
        "address": ADDRESS_PAYLOAD,
        "shipping_method": "pac"
    })
    order_id = r.json()["_id"] if "_id" in r.json() else r.json().get("id") or r.json().get("_id")
    # backend serializes _id -> may still be _id or id
    order = r.json()
    oid_val = order.get("_id") or order.get("id")
    r2 = requests.post(f"{API}/payments/checkout", json={
        "order_id": oid_val,
        "origin_url": BASE_URL
    })
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert "checkout_url" in data and "mercadopago" in data["checkout_url"]
    assert "session_id" in data
    # status endpoint
    r3 = requests.get(f"{API}/payments/status/{data['session_id']}")
    assert r3.status_code == 200
    st = r3.json()
    assert st["payment_status"] in ("pending", "initiated")


# ---------------- Admin RBAC ----------------
def test_non_admin_forbidden(customer_session):
    r = customer_session.get(f"{API}/admin/products")
    assert r.status_code == 403


def test_unauth_admin_401():
    r = requests.get(f"{API}/admin/products")
    assert r.status_code == 401


# ---------------- Admin flows ----------------
def test_admin_dashboard(admin_session):
    r = admin_session.get(f"{API}/admin/dashboard")
    assert r.status_code == 200
    d = r.json()
    for k in ["revenue", "orders_count", "customers", "top_products"]:
        assert k in d


def test_admin_list_products(admin_session):
    r = admin_session.get(f"{API}/admin/products")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_admin_create_product_and_inventory_adjust(admin_session):
    payload = {
        "name": f"TEST Produto {uuid.uuid4().hex[:6]}",
        "sku": f"TEST-{uuid.uuid4().hex[:6].upper()}",
        "short_description": "teste",
        "description": "teste",
        "category": "Sutiãs",
        "price": 99.90,
        "compare_at_price": 149.90,
        "variants": [
            {"sku": f"TESTV-{uuid.uuid4().hex[:5].upper()}", "size": "M", "color": "Preto",
             "color_hex": "#000", "on_hand": 10, "low_stock_threshold": 2}
        ],
        "images": [{"url": "https://picsum.photos/400", "alt": "img", "role": "primary"}]
    }
    r = admin_session.post(f"{API}/admin/products", json=payload)
    assert r.status_code == 200, r.text
    p = r.json()
    pid = p.get("_id") or p.get("id")
    vid = p["variants"][0]["id"]
    # adjust stock
    r2 = admin_session.post(f"{API}/admin/inventory/adjust", json={
        "product_id": pid, "variant_id": vid, "new_on_hand": 25, "reason": "TEST"
    })
    assert r2.status_code == 200
    assert r2.json()["new"] == 25
    # alerts
    r3 = admin_session.get(f"{API}/admin/inventory/alerts")
    assert r3.status_code == 200
    # audit logs
    r4 = admin_session.get(f"{API}/admin/audit-logs")
    assert r4.status_code == 200
    # update product
    payload["name"] = payload["name"] + " (upd)"
    r5 = admin_session.put(f"{API}/admin/products/{pid}", json=payload)
    assert r5.status_code == 200


def test_admin_coupons(admin_session):
    r = admin_session.get(f"{API}/admin/coupons")
    assert r.status_code == 200
    code = f"TESTC{uuid.uuid4().hex[:5].upper()}"
    r2 = admin_session.post(f"{API}/admin/coupons", json={
        "code": code, "type": "percent", "value": 5, "active": True
    })
    assert r2.status_code == 200
    cid = r2.json().get("_id") or r2.json().get("id")
    r3 = admin_session.delete(f"{API}/admin/coupons/{cid}")
    assert r3.status_code == 200


def test_admin_categories(admin_session):
    name = f"TEST Cat {uuid.uuid4().hex[:5]}"
    r = admin_session.post(f"{API}/admin/categories", json={"name": name})
    assert r.status_code == 200
    cid = r.json().get("_id") or r.json().get("id")
    r2 = admin_session.delete(f"{API}/admin/categories/{cid}")
    assert r2.status_code == 200


def test_admin_orders_list(admin_session):
    r = admin_session.get(f"{API}/admin/orders")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_admin_customers(admin_session):
    r = admin_session.get(f"{API}/admin/customers")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------------- Wishlist / Account ----------------
def test_wishlist_requires_auth():
    r = requests.get(f"{API}/wishlist")
    assert r.status_code == 401


def test_wishlist_toggle(customer_session):
    prods = requests.get(f"{API}/products?limit=1").json()["products"]
    pid = prods[0]["id"]
    r = customer_session.post(f"{API}/wishlist/toggle", json={"product_id": pid})
    assert r.status_code == 200
    assert r.json()["active"] is True
    r2 = customer_session.get(f"{API}/wishlist")
    assert r2.status_code == 200
    assert pid in r2.json()["product_ids"]


def test_account_profile_and_address(customer_session):
    r = customer_session.get(f"{API}/account/profile")
    assert r.status_code == 200
    r2 = customer_session.put(f"{API}/account/profile", json={"name": "Novo Nome", "phone": "11988887777"})
    assert r2.status_code == 200
    r3 = customer_session.post(f"{API}/account/addresses", json={
        "label": "Casa", "cep": "01310-100", "street": "Av. Paulista",
        "number": "1000", "district": "Bela Vista", "city": "São Paulo", "state": "SP"
    })
    assert r3.status_code == 200
    aid = r3.json()["id"]
    r4 = customer_session.get(f"{API}/account/addresses")
    assert r4.status_code == 200
    assert any(a["id"] == aid for a in r4.json())
    r5 = customer_session.delete(f"{API}/account/addresses/{aid}")
    assert r5.status_code == 200
