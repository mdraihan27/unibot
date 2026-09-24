"""
Auth request/response schemas — input validation for all auth endpoints.
"""
import re
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


# ── Shared password rules ─────────────────────────────────────────────────────

PASSWORD_MIN_LENGTH = 8
PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_+=\[\]{}|;:',.<>/?`~])"
)


def validate_password_strength(password: str) -> str:
    """Reusable password strength validator."""
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError(
            f"Password must be at least {PASSWORD_MIN_LENGTH} characters long."
        )
    if not PASSWORD_REGEX.match(password):
        raise ValueError(
            "Password must contain at least one uppercase letter, "
            "one lowercase letter, one digit, and one special character."
        )
    return password


# ── Registration ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return validate_password_strength(value)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, value: str, info) -> str:
        password = info.data.get("password")
        if password and value != password:
            raise ValueError("Passwords do not match.")
        return value


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── OTP Verification ──────────────────────────────────────────────────────────

class OtpVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

    @field_validator("otp")
    @classmethod
    def otp_format(cls, value: str) -> str:
        value = value.strip()
        if not value.isdigit():
            raise ValueError("OTP must contain digits only.")
        if len(value) != 6:
            raise ValueError("OTP must be exactly 6 digits.")
        return value


# ── OTP Re-send (request a new OTP) ──────────────────────────────────────────

class OtpResendRequest(BaseModel):
    email: EmailStr


# ── Auth response data ────────────────────────────────────────────────────────

class TokenData(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"


class UserPublic(BaseModel):
    """Safe user representation — never includes passwords or OTP codes."""
    email: str
    is_verified: bool
