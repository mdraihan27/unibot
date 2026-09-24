"""
MongoDB async connection manager using Motor.

Usage:
    from app.database.mongodb import Database

    db = Database.get_db()
    collection = db["users"]
"""
import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config.settings import settings

logger = logging.getLogger(__name__)


class Database:
    """Singleton-style MongoDB connection manager."""

    _client: AsyncIOMotorClient | None = None
    _db: AsyncIOMotorDatabase | None = None

    # ── Lifecycle ────────────────────────────────────────────────────────────

    @classmethod
    async def connect(cls) -> None:
        """Open the MongoDB connection. Called at app startup."""
        try:
            cls._client = AsyncIOMotorClient(
                settings.MONGO_URI,
                serverSelectionTimeoutMS=5000,
            )
            cls._db = cls._client[settings.MONGO_DB_NAME]
            # Ping to verify the connection is reachable
            await cls._client.admin.command("ping")
            logger.info(
                "✅ Connected to MongoDB — database: %s", settings.MONGO_DB_NAME
            )
        except Exception as exc:
            logger.critical("❌ Failed to connect to MongoDB: %s", exc)
            raise

    @classmethod
    async def disconnect(cls) -> None:
        """Close the MongoDB connection. Called at app shutdown."""
        if cls._client is not None:
            cls._client.close()
            cls._client = None
            cls._db = None
            logger.info("🔌 MongoDB connection closed.")

    # ── Access ───────────────────────────────────────────────────────────────

    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """Return the active database handle. Raises if not connected."""
        if cls._db is None:
            raise RuntimeError(
                "Database is not connected. "
                "Ensure Database.connect() was called during app startup."
            )
        return cls._db
