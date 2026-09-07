from db import db, now


async def log_action(user, action, entity_type, entity_id=None, description="", meta=None):
    await db.audit_logs.insert_one({
        "user_id": user.get("id") if user else None,
        "user_email": user.get("email") if user else None,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "description": description,
        "meta": meta or {},
        "created_at": now(),
    })
