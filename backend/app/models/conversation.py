from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional
from bson import ObjectId
from pydantic import BaseModel, Field

from app.models.user import PyObjectId


class SourceCitationModel(BaseModel):
    source_file: str
    page: Optional[int | str] = None
    similarity_score: Optional[float] = None


class MessageModel(BaseModel):
    id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    role: str = Field(description="'user' or 'assistant'")
    content: str
    sources: List[SourceCitationModel] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "sources": [s.model_dump() for s in self.sources],
            "created_at": self.created_at.isoformat(),
        }


class ConversationModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: Optional[str] = Field(default="guest", index=True)
    title: str = Field(default="New Conversation")
    model_name: Optional[str] = None
    is_pinned: bool = False
    is_archived: bool = False
    message_count: int = 0
    last_message_at: Optional[datetime] = None
    messages: List[MessageModel] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "protected_namespaces": (),
        "json_encoders": {ObjectId: str},
    }

    def to_mongo(self) -> dict:
        data = self.model_dump(by_alias=True, exclude_none=True)
        data.pop("_id", None)
        return data

    @classmethod
    def from_mongo(cls, data: dict) -> "ConversationModel":
        if not data:
            raise ValueError("Data cannot be empty")
        return cls(**data)

    def to_summary_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id) if self.id else "",
            "title": self.title,
            "user_id": self.user_id,
            "is_pinned": self.is_pinned,
            "is_archived": self.is_archived,
            "message_count": self.message_count,
            "last_message_at": self.last_message_at.isoformat() if self.last_message_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def to_detail_dict(self) -> Dict[str, Any]:
        summary = self.to_summary_dict()
        summary["messages"] = [m.to_dict() for m in self.messages]
        return summary
