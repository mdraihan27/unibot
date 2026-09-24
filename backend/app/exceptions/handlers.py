"""
Global exception handlers registered on the FastAPI app.

Maps every domain exception (and framework validation errors) to the
standard ApiResponse envelope so clients always get a consistent shape.
"""
import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.exceptions.auth import UnibotBaseException
from app.schemas.response import ApiResponse

logger = logging.getLogger(__name__)


def _json(response: ApiResponse, status_code: int) -> JSONResponse:
    return JSONResponse(content=response.model_dump(), status_code=status_code)


def register_exception_handlers(app: FastAPI) -> None:
    """Attach all global exception handlers to the FastAPI instance."""

    # ── Domain exceptions ─────────────────────────────────────────────────────
    @app.exception_handler(UnibotBaseException)
    async def unibot_exception_handler(
        request: Request, exc: UnibotBaseException
    ) -> JSONResponse:
        logger.warning(
            "Domain error [%s] on %s %s: %s",
            exc.code,
            request.method,
            request.url.path,
            exc.message,
        )
        return _json(
            ApiResponse.fail(message=exc.message, code=exc.code),
            status_code=exc.status_code,
        )

    # ── Pydantic / FastAPI validation errors ──────────────────────────────────
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """
        Converts Pydantic validation errors into a single, readable message
        that lists all failed fields.
        """
        errors = exc.errors()
        details = []
        for err in errors:
            field = " → ".join(str(loc) for loc in err["loc"] if loc != "body")
            details.append(f"{field}: {err['msg']}" if field else err["msg"])

        message = (
            "Request validation failed. "
            + " | ".join(details)
            if details
            else "One or more fields failed validation."
        )

        logger.info(
            "Validation error on %s %s: %s",
            request.method,
            request.url.path,
            details,
        )
        return _json(
            ApiResponse.fail(message=message, code="VALIDATION_ERROR"),
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    # ── Pydantic model validation (internal) ──────────────────────────────────
    @app.exception_handler(ValidationError)
    async def pydantic_model_error_handler(
        request: Request, exc: ValidationError
    ) -> JSONResponse:
        logger.error("Internal model validation error: %s", exc)
        return _json(
            ApiResponse.fail(
                message="An internal data validation error occurred.",
                code="INTERNAL_VALIDATION_ERROR",
            ),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # ── Catch-all ─────────────────────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception(
            "Unhandled exception on %s %s", request.method, request.url.path
        )
        return _json(
            ApiResponse.fail(
                message=(
                    "An unexpected server error occurred. "
                    "Our team has been notified. Please try again later."
                ),
                code="INTERNAL_SERVER_ERROR",
            ),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
