import os
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = _client[os.environ.get("DB_NAME", "femmora")]


def now():
    return datetime.now(timezone.utc)


def oid(value):
    """Return ObjectId for a value, or None if invalid."""
    try:
        return ObjectId(value)
    except Exception:
        return None


def serialize(doc):
    """Recursively convert ObjectId/datetime to JSON friendly values and _id -> id."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize(d) for d in doc]
    if isinstance(doc, dict):
        out = {}
        for k, v in doc.items():
            if k == "_id":
                out["id"] = str(v)
            elif k == "password_hash":
                continue
            else:
                out[k] = serialize(v)
        return out
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc


async def next_sequence(name: str) -> int:
    res = await db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return res["seq"]
