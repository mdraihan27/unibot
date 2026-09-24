"""
Unibot FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.database.mongodb import Database
from app.exceptions.handlers import register_exception_handlers
from app.routers import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan — startup & shutdown."""
    await Database.connect()
    yield
    await Database.disconnect()


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI instance."""
    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Unibot Backend API",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # ── CORS ────────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Tighten this in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ─────────────────────────────────────────────────────────────
    application.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])

    # ── Exception handlers ───────────────────────────────────────────────────
    register_exception_handlers(application)

    return application


app = create_app()


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
