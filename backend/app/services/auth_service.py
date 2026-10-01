"""
Auth Service — handles user registration and login business logic.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from app.database.mongodb import Database
from app.exceptions.auth import (
    AccountNotVerifiedError,
    DatabaseError,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
)
from app.models.user import UserModel
from app.schemas.auth import LoginRequest, RegisterRequest, TokenData
from app.services.otp_service import OtpService
from app.utils.security import JWTHelper, PasswordHelper

logger = logging.getLogger(__name__)


class AuthService:
    """Handles registration and login; delegates OTP lifecycle to OtpService."""

    COLLECTION = "users"

    # ── Registration ──────────────────────────────────────────────────────────

    @classmethod
    async def register(cls, payload: RegisterRequest) -> dict:
        """
        Register a new user.

        Steps:
          1. Check for duplicate email.
          2. Hash password.
          3. Insert user document.
          4. Auto-issue OTP (so the user can verify immediately).

        Returns:
            dict with ``email`` and ``is_verified`` keys.

        Raises:
            EmailAlreadyExistsError: If email is taken.
            DatabaseError: On unexpected MongoDB errors.
        """
        db = Database.get_db()

        # ── 1. Duplicate email check ────────────────────────────────────────
        try:
            existing = await db[cls.COLLECTION].find_one({"email": payload.email})
        except Exception as exc:
            logger.error("Register — DB read failed: %s", exc)
            raise DatabaseError() from exc

        if existing is not None:
            raise EmailAlreadyExistsError()

        # ── 2. Hash password ────────────────────────────────────────────────
        hashed_password = PasswordHelper.hash(payload.password)

        # ── 3. Insert user ──────────────────────────────────────────────────
        user = UserModel(
            name=payload.name.strip(),
            roll=payload.roll.strip(),
            department=payload.department.strip(),
            faculty=payload.faculty.strip(),
            email=payload.email,
            hashed_password=hashed_password,
        )
        try:
            result = await db[cls.COLLECTION].insert_one(user.to_mongo())
            if not result.inserted_id:
                raise RuntimeError("Insert returned no ID.")
        except Exception as exc:
            logger.error("Register — DB insert failed: %s", exc)
            raise DatabaseError() from exc

        logger.info("New user registered: %s (Roll: %s)", payload.email, payload.roll)

        # ── 4. Auto-issue OTP ───────────────────────────────────────────────
        try:
            await OtpService.issue_otp(payload.email)
        except Exception as exc:
            # OTP failure is non-fatal at registration time; user can re-request
            logger.warning("Register — OTP auto-issue failed for %s: %s", payload.email, exc)

        return {
            "name": user.name,
            "roll": user.roll,
            "department": user.department,
            "faculty": user.faculty,
            "email": payload.email,
            "is_verified": False,
        }

    # ── Login ─────────────────────────────────────────────────────────────────

    @classmethod
    async def login(cls, payload: LoginRequest) -> TokenData:
        """
        Authenticate a user and return JWT tokens.

        Raises:
            UserNotFoundError: If no account exists for the email.
            InvalidCredentialsError: If the password is wrong.
            AccountNotVerifiedError: If the account hasn't been OTP-verified.
            DatabaseError: On unexpected MongoDB errors.
        """
        db = Database.get_db()

        # ── Fetch user ──────────────────────────────────────────────────────
        try:
            user_doc = await db[cls.COLLECTION].find_one({"email": payload.email})
        except Exception as exc:
            logger.error("Login — DB read failed for %s: %s", payload.email, exc)
            raise DatabaseError() from exc

        if user_doc is None:
            raise UserNotFoundError()

        user = UserModel.from_mongo(user_doc)

        # ── Password check ──────────────────────────────────────────────────
        if not PasswordHelper.verify(payload.password, user.hashed_password):
            raise InvalidCredentialsError()

        # ── Verification check ──────────────────────────────────────────────
        if not user.is_verified:
            raise AccountNotVerifiedError()

        # ── Issue tokens ────────────────────────────────────────────────────
        access_token = JWTHelper.create_access_token(subject=user.email)
        refresh_token = JWTHelper.create_refresh_token(subject=user.email)

        # Update last login timestamp
        try:
            await db[cls.COLLECTION].update_one(
                {"email": user.email},
                {"$set": {"updated_at": datetime.now(timezone.utc)}},
            )
        except Exception as exc:
            logger.warning("Login — Could not update last login time: %s", exc)

        logger.info("User logged in: %s", user.email)
        return TokenData(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    @classmethod
    async def get_by_email(cls, email: str) -> Optional[UserModel]:
        db = Database.get_db()
        try:
            doc = await db[cls.COLLECTION].find_one({"email": email})
            if not doc:
                import re
                doc = await db[cls.COLLECTION].find_one(
                    {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}}
                )
            if doc:
                return UserModel.from_mongo(doc)
        except Exception as exc:
            logger.warning("get_by_email error for %s: %s", email, exc)
        return None
