import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.database.mongodb import Database
from app.exceptions.chat import (
    ConversationNotFoundError,
    InvalidConversationIdError,
)
from app.models.conversation import (
    ConversationModel,
    MessageModel,
    SourceCitationModel,
)

logger = logging.getLogger(__name__)


class ChatService:
    _pipeline = None

    @classmethod
    def get_pipeline(cls):
        if cls._pipeline is None:
            logger.info("Initializing RAGPipeline in ChatService...")
            from rag.pipeline import RAGPipeline

            cls._pipeline = RAGPipeline()
            logger.info("RAGPipeline initialized successfully.")
        return cls._pipeline

    @classmethod
    def _get_collection(cls):
        db = Database.get_db()
        return db["conversations"]

    @classmethod
    async def ensure_indexes(cls) -> None:
        try:
            col = cls._get_collection()
            await col.create_index([("user_id", 1), ("updated_at", -1)])
            await col.create_index([("user_id", 1), ("is_archived", 1)])
        except Exception as exc:
            logger.warning(f"Could not create conversation indexes: {exc}")

    @classmethod
    async def create_conversation(
        cls,
        user_id: str = "guest",
        title: Optional[str] = None,
    ) -> ConversationModel:
        col = cls._get_collection()
        conversation = ConversationModel(
            user_id=user_id,
            title=title.strip() if title and title.strip() else "New Conversation",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        doc = conversation.to_mongo()
        result = await col.insert_one(doc)
        conversation.id = result.inserted_id
        return conversation

    @classmethod
    async def list_conversations(
        cls,
        user_id: str = "guest",
        include_archived: bool = False,
        limit: int = 50,
    ) -> List[ConversationModel]:
        col = cls._get_collection()
        query: Dict[str, Any] = {"user_id": user_id}
        if not include_archived:
            query["is_archived"] = False

        cursor = col.find(query).sort("updated_at", -1).limit(limit)
        conversations: List[ConversationModel] = []
        async for doc in cursor:
            conversations.append(ConversationModel.from_mongo(doc))
        return conversations

    @classmethod
    async def get_conversation(
        cls,
        conversation_id: str,
        user_id: Optional[str] = None,
    ) -> ConversationModel:
        if not ObjectId.is_valid(conversation_id):
            raise InvalidConversationIdError()

        col = cls._get_collection()
        query: Dict[str, Any] = {"_id": ObjectId(conversation_id)}
        if user_id and user_id != "guest":
            query["user_id"] = user_id

        doc = await col.find_one(query)
        if not doc:
            raise ConversationNotFoundError()
        return ConversationModel.from_mongo(doc)

    @classmethod
    async def update_conversation(
        cls,
        conversation_id: str,
        user_id: str,
        title: Optional[str] = None,
        is_pinned: Optional[bool] = None,
        is_archived: Optional[bool] = None,
    ) -> ConversationModel:
        conversation = await cls.get_conversation(conversation_id, user_id)
        col = cls._get_collection()

        updates: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
        if title is not None and title.strip():
            updates["title"] = title.strip()
        if is_pinned is not None:
            updates["is_pinned"] = is_pinned
        if is_archived is not None:
            updates["is_archived"] = is_archived

        await col.update_one({"_id": ObjectId(conversation_id)}, {"$set": updates})
        return await cls.get_conversation(conversation_id, user_id)

    @classmethod
    async def delete_conversation(
        cls,
        conversation_id: str,
        user_id: str,
    ) -> bool:
        await cls.get_conversation(conversation_id, user_id)
        col = cls._get_collection()
        result = await col.delete_one({"_id": ObjectId(conversation_id)})
        return result.deleted_count > 0

    @classmethod
    def _generate_auto_title(cls, message_text: str) -> str:
        clean = message_text.strip().replace("\n", " ")
        prefixes = [
            r"^(what is|what are|when is|when are|where is|where are|how to|how do i|tell me about|can you tell me|please tell me)\s+",
            r"^(কি|কখন|কোথায়|কিভাবে)\s+",
        ]
        for p in prefixes:
            clean = re.sub(p, "", clean, flags=re.IGNORECASE)

        clean = clean.strip(" ?.!/\\-")
        if not clean:
            clean = message_text[:30].strip()

        words = clean.split()
        if len(words) > 6:
            title = " ".join(words[:6])
        else:
            title = clean

        title = title[:45].strip()
        if not title:
            title = "JUST Chat"
        return title[0].upper() + title[1:] if len(title) > 1 else title.upper()

    @classmethod
    async def send_message(
        cls,
        conversation_id: Optional[str],
        user_id: str,
        message_text: str,
        top_k: int = 6,
        score_threshold: Optional[float] = None,
        top_folder: Optional[str] = None,
    ) -> Dict[str, Any]:
        col = cls._get_collection()
        now = datetime.now(timezone.utc)

        if not conversation_id:
            conversation = await cls.create_conversation(user_id=user_id)
            conversation_id = str(conversation.id)
        else:
            conversation = await cls.get_conversation(conversation_id, user_id)

        user_message = MessageModel(
            role="user",
            content=message_text,
            created_at=now,
        )

        should_auto_title = (
            conversation.title in {"New Conversation", "New Chat", "JUST Chat"}
            or conversation.message_count == 0
        )
        new_title = conversation.title
        if should_auto_title:
            new_title = cls._generate_auto_title(message_text)

        pipeline = cls.get_pipeline()
        refusal_marker = "don't have that information"
        sources_list: List[SourceCitationModel] = []

        try:
            rag_result = await asyncio.to_thread(
                pipeline.answer,
                question=message_text,
                top_folder=top_folder,
                top_k=top_k,
            )
            answer_text = rag_result.text

            # If the model does not refuse the query, extract sources from hits
            if refusal_marker not in answer_text.lower():
                seen_sources = set()
                for hit in getattr(rag_result, "hits", []):
                    if score_threshold is not None and hit.score is not None and hit.score < score_threshold:
                        continue
                    src = hit.metadata.get("source", "")
                    if src and src not in seen_sources:
                        seen_sources.add(src)
                        sources_list.append(
                            SourceCitationModel(
                                source_file=src,
                                page=hit.metadata.get("page"),
                                similarity_score=round(hit.score, 4) if hit.score is not None else None,
                            )
                        )
                # Fallback to result.sources if hits list was empty
                if not sources_list:
                    for src in getattr(rag_result, "sources", []):
                        if src and src not in seen_sources:
                            seen_sources.add(src)
                            sources_list.append(SourceCitationModel(source_file=src))
        except Exception as exc:
            logger.error(f"Error executing RAG pipeline: {exc}", exc_info=True)
            answer_text = (
                "An error occurred while retrieving information from JUST university documents. "
                "Please try again or rephrase your query."
            )
            sources_list = []

        assistant_message = MessageModel(
            role="assistant",
            content=answer_text,
            sources=sources_list,
            created_at=datetime.now(timezone.utc),
        )

        all_messages = conversation.messages + [user_message, assistant_message]
        update_doc = {
            "title": new_title,
            "messages": [m.model_dump() for m in all_messages],
            "message_count": len(all_messages),
            "last_message_at": assistant_message.created_at,
            "updated_at": assistant_message.created_at,
        }

        await col.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": update_doc},
        )

        return {
            "conversation_id": conversation_id,
            "title": new_title,
            "user_message": user_message.to_dict(),
            "assistant_message": assistant_message.to_dict(),
        }
