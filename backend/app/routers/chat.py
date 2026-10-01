import asyncio
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query

from app.schemas.chat import (
    CreateConversationRequest,
    QuickChatRequest,
    SendMessageRequest,
    UpdateConversationRequest,
)
from app.schemas.response import ApiResponse
from app.services.chat_service import ChatService
from app.utils.dependencies import get_optional_user_id

router = APIRouter()


@router.post(
    "/conversations",
    response_model=ApiResponse,
    status_code=201,
    summary="Create a new chat conversation",
    description="Creates a new conversation session for the user with an optional initial title.",
)
async def create_conversation(
    payload: Optional[CreateConversationRequest] = None,
    user_id: str = Depends(get_optional_user_id),
) -> ApiResponse:
    title = payload.title if payload else None
    conversation = await ChatService.create_conversation(user_id=user_id, title=title)
    return ApiResponse.ok(
        message="Conversation created successfully.",
        code="CONVERSATION_CREATED",
        data=conversation.to_detail_dict(),
    )


@router.get(
    "/conversations",
    response_model=ApiResponse,
    summary="List all chat conversations",
    description="Retrieves a list of conversations for the user, ordered by most recently updated.",
)
async def list_conversations(
    include_archived: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    user_id: str = Depends(get_optional_user_id),
) -> ApiResponse:
    conversations = await ChatService.list_conversations(
        user_id=user_id,
        include_archived=include_archived,
        limit=limit,
    )
    data = [c.to_summary_dict() for c in conversations]
    return ApiResponse.ok(
        message="Conversations retrieved successfully.",
        code="CONVERSATIONS_FETCHED",
        data=data,
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ApiResponse,
    summary="Get conversation detail with messages",
    description="Retrieves the full conversation history including all user and assistant messages.",
)
async def get_conversation(
    conversation_id: str,
    user_id: str = Depends(get_optional_user_id),
) -> ApiResponse:
    conversation = await ChatService.get_conversation(
        conversation_id=conversation_id,
        user_id=user_id,
    )
    return ApiResponse.ok(
        message="Conversation retrieved successfully.",
        code="CONVERSATION_FETCHED",
        data=conversation.to_detail_dict(),
    )


@router.patch(
    "/conversations/{conversation_id}",
    response_model=ApiResponse,
    summary="Update conversation metadata",
    description="Update the conversation title, pin status, or archive status.",
)
async def update_conversation(
    conversation_id: str,
    payload: UpdateConversationRequest,
    user_id: str = Depends(get_optional_user_id),
) -> ApiResponse:
    updated = await ChatService.update_conversation(
        conversation_id=conversation_id,
        user_id=user_id,
        title=payload.title,
        is_pinned=payload.is_pinned,
        is_archived=payload.is_archived,
    )
    return ApiResponse.ok(
        message="Conversation updated successfully.",
        code="CONVERSATION_UPDATED",
        data=updated.to_detail_dict(),
    )


@router.delete(
    "/conversations/{conversation_id}",
    response_model=ApiResponse,
    summary="Delete a conversation",
    description="Permanently deletes the conversation and all of its associated messages.",
)
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_optional_user_id),
) -> ApiResponse:
    await ChatService.delete_conversation(
        conversation_id=conversation_id,
        user_id=user_id,
    )
    return ApiResponse.ok(
        message="Conversation deleted successfully.",
        code="CONVERSATION_DELETED",
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ApiResponse,
    summary="Send message and receive JUST RAG answer",
    description="Sends a student question to the specified conversation, retrieves context from JUST documents, generates an answer, and persists both messages.",
)
async def send_message_to_conversation(
    conversation_id: str,
    payload: SendMessageRequest,
    user_id: str = Depends(get_optional_user_id),
) -> ApiResponse:
    result = await ChatService.send_message(
        conversation_id=conversation_id,
        user_id=user_id,
        message_text=payload.message,
        top_k=payload.top_k or 6,
        score_threshold=payload.score_threshold,
        top_folder=payload.top_folder,
    )
    return ApiResponse.ok(
        message="Message processed successfully.",
        code="MESSAGE_SENT",
        data=result,
    )


@router.post(
    "/quick",
    response_model=ApiResponse,
    summary="Quick chat endpoint",
    description="Sends a message to an existing conversation or automatically creates a new one with auto-generated title if conversation_id is not provided.",
)
async def quick_chat(
    payload: QuickChatRequest,
    user_id: str = Depends(get_optional_user_id),
) -> ApiResponse:
    result = await ChatService.send_message(
        conversation_id=payload.conversation_id,
        user_id=user_id,
        message_text=payload.message,
        top_k=payload.top_k or 6,
        score_threshold=payload.score_threshold,
        top_folder=payload.top_folder,
    )
    return ApiResponse.ok(
        message="Chat response generated successfully.",
        code="CHAT_SUCCESS",
        data=result,
    )


@router.post(
    "/reingest",
    response_model=ApiResponse,
    summary="Re-index all documents in data folder",
    description="Clears the vector store and re-embeds all documents located in data/raw directory.",
)
async def reingest_documents() -> ApiResponse:
    pipeline = ChatService.get_pipeline()
    count = await asyncio.to_thread(pipeline.reingest)
    return ApiResponse.ok(
        message=f"Document reingestion completed successfully. {count} chunks indexed.",
        code="REINGEST_SUCCESS",
        data={"total_chunks": count},
    )

