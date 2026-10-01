from typing import Optional
from fastapi import Header
from app.utils.security import JWTHelper


async def get_optional_user_id(
    authorization: Optional[str] = Header(default=None),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
    x_session_id: Optional[str] = Header(default=None, alias="X-Session-ID"),
) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = JWTHelper.decode(token)
        if payload and payload.get("sub"):
            return str(payload.get("sub"))

    if x_user_id and x_user_id.strip():
        return x_user_id.strip()

    if x_session_id and x_session_id.strip():
        return x_session_id.strip()

    return "guest"
