"""Seed realistic Femmora catalog: categories, collections, products with variants, coupon."""
import uuid
from slugify import slugify
from db import db, now

IMG = {
    "bra_red": "https://images.unsplash.com/photo-1642945680515-faada4c0ca7b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "set_teal": "https://images.unsplash.com/photo-1778863663181-2ae9f04df79f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "body_black": "https://images.unsplash.com/photo-1778436196655-eb8507c86a26?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "bra_black": "https://images.unsplash.com/photo-1613618196650-ff01228662fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "silk_blue": "https://images.unsplash.com/photo-1755090267598-da15d862ff6f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "pj_taupe": "https://images.unsplash.com/photo-1770294758967-6ed2b93ce42c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "silk_cream": "https://images.unsplash.com/photo-1777462823729-6074bd6aeb9b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "silk_pink": "https://images.unsplash.com/photo-1777462985111-9da64fb2e6e6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "gown_pink": "https://images.unsplash.com/photo-1652735822412-6aa4853de907?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "pj_navy": "https://images.unsplash.com/photo-1766056278944-ca0e4f49e61f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "cami_black": "https://images.unsplash.com/photo-1770294758971-44fa1eae61a3?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "pj_lilac": "https://images.unsplash.com/photo-1766056278825-55168658f120?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "ed_bed": "https://images.unsplash.com/photo-1767125336493-cc8d660ef78c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "ed_couch": "https://images.unsplash.com/photo-1653277135616-c062b194440e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "ed_field": "https://images.unsplash.com/photo-1586716261707-46d26744f864?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "ed_veil": "https://images.unsplash.com/photo-1713190277225-9a345031e9ac?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
}

CATEGORIES = [
    ("Sutiãs", "Sutiãs de renda, cetim e microfibra", IMG["bra_red"]),
    ("Calcinhas", "Do básico ao rendado, para todos os dias", IMG["silk_pink"]),
    ("Conjuntos", "Conjuntos coordenados que valorizam o corpo", IMG["set_teal"]),
    ("Bodies", "Peças statement de acabamento impecável", IMG["body_black"]),
    ("Camisolas", "Camisolas em seda e cetim para dormir com sofisticação", IMG["gown_pink"]),
    ("Pijamas", "Pijamas de cetim e algodão premium", IMG["pj_navy"]),
]

COLLECTIONS = ["Essenciais", "Noite", "Coleção Bordeaux"]

SIZES_STD = ["PP", "P", "M", "G", "GG"]
COLOR_MAP = {
    "Preto": "#111111", "Bordô": "#5a1420", "Vermelho": "#a01326", "Branco": "#f6f3ee",
    "Nude": "#d9b8a3", "Rosé": "#e6b7bd", "Azul": "#8fbcc9", "Marinho": "#22304a",
    "Lilás": "#b9a7cf", "Champagne": "#e7d6bd",
}

SIZE_GUIDE = [
    {"size": "PP", "bust": "78-82 cm", "waist": "58-62 cm", "hips": "84-88 cm"},
    {"size": "P", "bust": "82-86 cm", "waist": "62-66 cm", "hips": "88-92 cm"},
    {"size": "M", "bust": "86-90 cm", "waist": "66-70 cm", "hips": "92-96 cm"},
    {"size": "G", "bust": "90-94 cm", "waist": "70-74 cm", "hips": "96-100 cm"},
    {"size": "GG", "bust": "94-98 cm", "waist": "74-78 cm", "hips": "100-104 cm"},
]


def build_variants(sku_base, colors, sizes, price, compare=None, stock_pattern=None):
    variants = []
    stock_pattern = stock_pattern or [8, 6, 5, 3, 0]
    for ci, (color) in enumerate(colors):
        for si, size in enumerate(sizes):
            variants.append({
                "id": uuid.uuid4().hex,
                "sku": f"{sku_base}-{size}-{slugify(color)[:2].upper()}",
                "size": size,
                "color": color,
                "color_hex": COLOR_MAP.get(color, "#cccccc"),
                "price": price,
                "compare_at_price": compare,
                "on_hand": stock_pattern[(si + ci) % len(stock_pattern)],
                "reserved": 0,
                "low_stock_threshold": 3,
            })
    return variants


def imgs(*urls):
    out = []
    for i, u in enumerate(urls):
        role = "primary" if i == 0 else ("hover" if i == 1 else "gallery")
        out.append({"url": u, "alt": "Peça de lingerie Femmora", "role": role, "sort_order": i})
    return out


def product(name, category, collection, price, images, colors, sku_base, compare=None,
            desc="", short="", featured=False, new=False, comp="", care="", sizes=None):
    sizes = sizes or SIZES_STD
    return {
        "_id": uuid.uuid4().hex,
        "name": name,
        "slug": slugify(name),
        "sku": sku_base,
        "short_description": short,
        "description": desc,
        "category": category,
        "category_slug": slugify(category),
        "collection": collection,
        "tags": [category.lower(), (collection or "").lower()],
        "price": price,
        "compare_at_price": compare,
        "promo_starts_at": None,
        "promo_ends_at": None,
        "status": "active",
        "is_featured": featured,
        "is_new": new,
        "low_stock_threshold": 3,
        "variants": build_variants(sku_base, colors, sizes, price, compare),
        "images": images,
        "composition": comp or "90% Poliamida, 10% Elastano. Forro em algodão.",
        "care": care or "Lavar à mão em água fria. Não usar alvejante. Secar à sombra.",
        "size_guide": SIZE_GUIDE,
        "seo_title": f"{name} | Femmora",
        "seo_description": short or name,
        "created_at": now(),
        "updated_at": now(),
    }


def catalog():
    return [
        product("Sutiã Renda Bordeaux", "Sutiãs", "Coleção Bordeaux", 189.90,
                imgs(IMG["bra_red"], IMG["ed_bed"], IMG["ed_veil"]),
                ["Bordô", "Preto"], "SUT-001", compare=239.90,
                short="Renda floral com bojo removível e alças ajustáveis.",
                desc="Um sutiã que combina a delicadeza da renda floral com sustentação perfeita. O bojo removível e as alças reguláveis oferecem conforto o dia inteiro, enquanto o tom bordô confere um ar de sofisticação atemporal.",
                featured=True, new=True),
        product("Conjunto Aurora", "Conjuntos", "Essenciais", 289.90,
                imgs(IMG["set_teal"], IMG["ed_couch"]),
                ["Azul", "Nude"], "CJ-002",
                short="Conjunto sutiã e calcinha em renda leve.",
                desc="O conjunto Aurora traduz leveza. Renda respirável, caimento impecável e acabamento em festonê para um visual coordenado e elegante.",
                featured=True),
        product("Body Séduction", "Bodies", "Noite", 259.90,
                imgs(IMG["body_black"], IMG["ed_veil"]),
                ["Preto"], "BD-003", compare=299.90,
                short="Body de renda com decote profundo nas costas.",
                desc="Uma peça statement. O Body Séduction abraça as curvas com renda translúcida e um decote nas costas que revela na medida certa.",
                featured=True, new=True),
        product("Sutiã Noir Essential", "Sutiãs", "Essenciais", 169.90,
                imgs(IMG["bra_black"], IMG["ed_field"]),
                ["Preto", "Nude"], "SUT-004",
                short="O sutiã preto essencial de todo guarda-roupa.",
                desc="Versátil e confortável, o Noir Essential é a base perfeita. Microfibra sedosa e sustentação discreta para uso diário."),
        product("Camisola Seda Lumière", "Camisolas", "Noite", 229.90,
                imgs(IMG["gown_pink"], IMG["silk_pink"]),
                ["Rosé", "Champagne"], "CAM-005",
                short="Camisola slip de cetim com caimento fluido.",
                desc="Cetim acetinado que desliza sobre a pele. A Lumière tem caimento fluido e alças finas para noites de puro conforto.",
                comp="100% Poliéster acetinado (toque de seda).",
                new=True),
        product("Pijama Cetim Sereno", "Pijamas", "Noite", 319.90,
                imgs(IMG["pj_navy"], IMG["pj_taupe"], IMG["pj_lilac"]),
                ["Marinho", "Lilás"], "PJ-006", compare=379.90,
                short="Pijama de cetim com camisa e calça.",
                desc="Conjunto de pijama em cetim premium com vivo contrastante. Elegância para relaxar em casa com todo o conforto.",
                comp="100% Poliéster acetinado.",
                featured=True),
        product("Calcinha Renda Blush", "Calcinhas", "Essenciais", 79.90,
                imgs(IMG["silk_pink"], IMG["silk_cream"]),
                ["Rosé", "Nude", "Branco"], "CAL-007",
                short="Calcinha de renda com cós acetinado.",
                desc="Delicada e confortável, a calcinha Blush tem renda macia e acabamento sem costuras aparentes."),
        product("Camisola Slip Rosé", "Camisolas", "Coleção Bordeaux", 199.90,
                imgs(IMG["pj_lilac"], IMG["silk_blue"]),
                ["Lilás", "Champagne"], "CAM-008",
                short="Slip curta em cetim com renda no decote.",
                desc="A slip Rosé une cetim leve e um detalhe de renda no decote. Perfeita para dormir com sofisticação."),
        product("Conjunto Nuit Noire", "Conjuntos", "Noite", 269.90,
                imgs(IMG["ed_field"], IMG["body_black"]),
                ["Preto"], "CJ-009",
                short="Conjunto ousado em renda transparente.",
                desc="Para as noites especiais. Nuit Noire tem renda transparente e modelagem que valoriza cada curva.",
                new=True),
        product("Body Véu", "Bodies", "Coleção Bordeaux", 239.90,
                imgs(IMG["ed_veil"], IMG["ed_bed"]),
                ["Preto", "Bordô"], "BD-010", compare=289.90,
                short="Body de tule com bordado floral.",
                desc="O Body Véu combina tule etéreo e bordado floral. Uma peça que é lingerie e obra de arte."),
    ]


async def run_seed():
    if await db.categories.count_documents({}) == 0:
        for i, (name, desc, img) in enumerate(CATEGORIES):
            await db.categories.insert_one({
                "_id": uuid.uuid4().hex, "name": name, "slug": slugify(name),
                "description": desc, "image": img, "sort_order": i * 10,
                "is_active": True, "created_at": now()})
    if await db.collections.count_documents({}) == 0:
        for i, name in enumerate(COLLECTIONS):
            await db.collections.insert_one({
                "_id": uuid.uuid4().hex, "name": name, "slug": slugify(name),
                "description": "", "is_active": True, "sort_order": i * 10, "created_at": now()})
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many(catalog())
    if await db.coupons.count_documents({}) == 0:
        await db.coupons.insert_one({
            "_id": uuid.uuid4().hex, "code": "BEMVINDA10", "type": "percent", "value": 10,
            "active": True, "starts_at": None, "ends_at": None, "min_subtotal": 0,
            "usage_limit": None, "per_customer_limit": None, "used_count": 0, "created_at": now()})
