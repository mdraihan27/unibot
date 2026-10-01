"""
Application settings loaded from environment variables via pydantic-settings.
All secrets MUST live in .env — never hard-code them here.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ─────────────────────────────────────────────────────────────────
    APP_NAME: str = "Unibot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── MongoDB ─────────────────────────────────────────────────────────────
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "unibot"

    # ── JWT ─────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── OTP ─────────────────────────────────────────────────────────────────
    OTP_DEFAULT: str = "123456"
    OTP_EXPIRE_MINUTES: int = 10


# Singleton — import this throughout the app
settings = Settings()
