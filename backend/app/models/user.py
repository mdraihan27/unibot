"""
User domain model — represents a document in the `users` MongoDB collection.
"""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field


class PyObjectId(ObjectId):
    """Pydantic-compatible BSON ObjectId."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, value, *args):
        if not ObjectId.is_valid(value):
            raise ValueError(f"Invalid ObjectId: {value!r}")
        return ObjectId(value)

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema

        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )


class UserModel(BaseModel):
    """
    Full user document stored in MongoDB.

    Collection: users
    """

    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    # ── Student Profile ──────────────────────────────────────────────────────
    name: str = ""
    roll: str = ""
    department: str = ""
    faculty: str = ""

    # ── Identity ─────────────────────────────────────────────────────────────
    email: EmailStr
    hashed_password: Optional[str] = None   # None for Google Sign-In users
    google_id: Optional[str] = None         # Google user sub (unique per Google account)
    picture: Optional[str] = None           # Profile picture URL from Google

    # ── Verification ─────────────────────────────────────────────────────────
    is_verified: bool = False
    otp_code: Optional[str] = None
    otp_expires_at: Optional[datetime] = None
    otp_requested_at: Optional[datetime] = None

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }

    def to_mongo(self) -> dict:
        """Serialize for MongoDB insertion (excludes None `_id`)."""
        data = self.model_dump(by_alias=True, exclude_none=True)
        data.pop("_id", None)  # Let MongoDB auto-generate _id on insert
        return data

    @classmethod
    def from_mongo(cls, data: dict) -> "UserModel":
        """Deserialize from a raw MongoDB document."""
        if data is None:
            raise ValueError("Cannot build UserModel from None")
        return cls(**data)
