"""
Auth Router — all authentication endpoints.

Endpoints:
  POST /api/v1/auth/register         — Create account
  POST /api/v1/auth/login            — Authenticate & get tokens
  POST /api/v1/auth/otp/verify       — Verify OTP code
  POST /api/v1/auth/otp/resend       — Request a new OTP
"""
from fastapi import APIRouter, Depends

from app.schemas.auth import (
    LoginRequest,
    OtpResendRequest,
    OtpVerifyRequest,
    RegisterRequest,
)
from app.schemas.response import ApiResponse
from app.services.auth_service import AuthService
from app.services.otp_service import OtpService
from app.utils.dependencies import get_optional_user_id

router = APIRouter()


# ── Current User Profile ──────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=ApiResponse,
    summary="Get current user profile",
    description="Returns profile information for the authenticated user, or guest details if unauthenticated.",
)
async def get_me(user_id: str = Depends(get_optional_user_id)) -> ApiResponse:
    if not user_id or user_id == "guest":
        return ApiResponse(
            success=False,
            message="No active student session. Please log in.",
            code="UNAUTHENTICATED",
            data=None,
        )

    user = await AuthService.get_by_email(user_id)
    if not user:
        return ApiResponse.ok(
            message="User profile",
            code="USER_PROFILE",
            data={
                "name": "JUST Student",
                "roll": "N/A",
                "department": "Computer Science & Engineering",
                "faculty": "Faculty of Engineering & Technology",
                "email": user_id,
                "is_verified": True,
            },
        )

    return ApiResponse.ok(
        message="Profile retrieved successfully",
        code="PROFILE_SUCCESS",
        data={
            "name": getattr(user, "name", "") or "JUST Student",
            "roll": getattr(user, "roll", "") or "N/A",
            "department": getattr(user, "department", "") or "Computer Science & Engineering",
            "faculty": getattr(user, "faculty", "") or "Faculty of Engineering & Technology",
            "email": user.email,
            "is_verified": user.is_verified,
        },
    )


# ── Register ──────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=ApiResponse,
    status_code=201,
    summary="Register a new user account",
    description=(
        "Creates a new user with email and password. "
        "An OTP is automatically issued — use /otp/verify to activate the account."
    ),
)
async def register(payload: RegisterRequest) -> ApiResponse:
    """
    Register endpoint.

    Possible error codes returned:
      - EMAIL_ALREADY_EXISTS (409)
      - VALIDATION_ERROR (422)  — invalid email, weak password, passwords don't match
      - DATABASE_ERROR (503)
    """
    user_data = await AuthService.register(payload)
    return ApiResponse.ok(
        message=(
            "Account created successfully. "
            "An OTP has been issued — please verify your account to continue."
        ),
        code="REGISTER_SUCCESS",
        data=user_data,
    )


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=ApiResponse,
    summary="Log in with email and password",
    description=(
        "Authenticates the user and returns JWT access and refresh tokens. "
        "Account must be OTP-verified before login is allowed."
    ),
)
async def login(payload: LoginRequest) -> ApiResponse:
    """
    Login endpoint.

    Possible error codes returned:
      - USER_NOT_FOUND (404)
      - INVALID_CREDENTIALS (401)
      - ACCOUNT_NOT_VERIFIED (403)
      - ACCOUNT_SUSPENDED (403)
      - VALIDATION_ERROR (422)
      - DATABASE_ERROR (503)
    """
    token_data = await AuthService.login(payload)
    return ApiResponse.ok(
        message="Login successful. Welcome back!",
        code="LOGIN_SUCCESS",
        data=token_data.model_dump(),
    )


# ── OTP Verify ────────────────────────────────────────────────────────────────

@router.post(
    "/otp/verify",
    response_model=ApiResponse,
    summary="Verify account using OTP",
    description=(
        "Validates the 6-digit OTP against the stored record. "
        "On success, the account is marked as verified and OTP fields are cleared."
    ),
)
async def verify_otp(payload: OtpVerifyRequest) -> ApiResponse:
    """
    OTP verification endpoint.

    Possible error codes returned:
      - USER_NOT_FOUND (404)
      - ACCOUNT_ALREADY_VERIFIED (409)
      - OTP_NOT_REQUESTED (400)
      - OTP_EXPIRED (410)
      - OTP_INVALID (422)
      - VALIDATION_ERROR (422)
      - DATABASE_ERROR (503)
    """
    await OtpService.verify_otp(email=payload.email, otp=payload.otp)
    return ApiResponse.ok(
        message=(
            "Your account has been successfully verified. "
            "You can now log in with your credentials."
        ),
        code="OTP_VERIFY_SUCCESS",
    )


# ── OTP Resend ────────────────────────────────────────────────────────────────

@router.post(
    "/otp/resend",
    response_model=ApiResponse,
    summary="Request a new OTP",
    description=(
        "Issues a fresh OTP for the given email. "
        "The previous OTP (if any) is overwritten. "
        "NOTE: No actual delivery occurs yet — the default OTP is 123456."
    ),
)
async def resend_otp(payload: OtpResendRequest) -> ApiResponse:
    """
    OTP resend endpoint.

    Possible error codes returned:
      - USER_NOT_FOUND (404)
      - ACCOUNT_ALREADY_VERIFIED (409)
      - VALIDATION_ERROR (422)
      - DATABASE_ERROR (503)
    """
    await OtpService.issue_otp(email=payload.email)
    return ApiResponse.ok(
        message=(
            "A new OTP has been issued for your account. "
            "Please use it to verify your account within the allowed time window."
        ),
        code="OTP_RESEND_SUCCESS",
    )
