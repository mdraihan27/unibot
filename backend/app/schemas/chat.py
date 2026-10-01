from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class CreateConversationRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=120)


class UpdateConversationRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=120)
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None


class SendMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    top_k: Optional[int] = Field(default=6, ge=1, le=15)
    score_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    top_folder: Optional[str] = Field(default=None, description="Optional folder filter e.g. 'admissions' or 'departments/cse'")


class QuickChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(min_length=1, max_length=4000)
    top_k: Optional[int] = Field(default=6, ge=1, le=15)
    score_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    top_folder: Optional[str] = Field(default=None, description="Optional folder filter e.g. 'admissions' or 'departments/cse'")


class SourceCitationResponse(BaseModel):
    source_file: str
    page: Optional[int | str] = None
    similarity_score: Optional[float] = None


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: List[SourceCitationResponse] = Field(default_factory=list)
    created_at: datetime


class ConversationSummaryResponse(BaseModel):
    id: str
    title: str
    user_id: Optional[str] = None
    is_pinned: bool = False
    is_archived: bool = False
    message_count: int = 0
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ConversationDetailResponse(BaseModel):
    id: str
    title: str
    user_id: Optional[str] = None
    is_pinned: bool = False
    is_archived: bool = False
    message_count: int = 0
    last_message_at: Optional[datetime] = None
    messages: List[MessageResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class SendMessageResponse(BaseModel):
    conversation_id: str
    title: str
    user_message: MessageResponse
    assistant_message: MessageResponse
