"""
OTP Service — generates, stores, and validates one-time passwords.

NOTE: No real delivery method is implemented yet.
      The default OTP (from settings.OTP_DEFAULT) always validates successfully.
"""
import logging
from datetime import datetime, timedelta, timezone

from app.config.settings import settings
from app.database.mongodb import Database
from app.exceptions.auth import (
    AccountAlreadyVerifiedError,
    DatabaseError,
    OtpExpiredError,
    OtpInvalidError,
    OtpNotRequestedError,
    UserNotFoundError,
)

logger = logging.getLogger(__name__)


class OtpService:
    """Handles OTP lifecycle: issue → store → verify."""

    COLLECTION = "users"

    # ── Issue ─────────────────────────────────────────────────────────────────

    @classmethod
    async def issue_otp(cls, email: str) -> str:
        """
        Generate and persist an OTP for the given email.

        Currently always issues `settings.OTP_DEFAULT` (no real sending).
        Replace this method's body to integrate an SMS / email provider later.

        Returns:
            The generated OTP string.

        Raises:
            UserNotFoundError: If no user with the given email exists.
            AccountAlreadyVerifiedError: If the account is already verified.
            DatabaseError: On unexpected MongoDB errors.
        """
        db = Database.get_db()
        try:
            user = await db[cls.COLLECTION].find_one({"email": email})
        except Exception as exc:
            logger.error("OTP issue — DB read failed for %s: %s", email, exc)
            raise DatabaseError() from exc

        if user is None:
            raise UserNotFoundError()

        if user.get("is_verified", False):
            raise AccountAlreadyVerifiedError()

        otp_code = settings.OTP_DEFAULT  # Swap with a real generator here
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.OTP_EXPIRE_MINUTES
        )

        try:
            await db[cls.COLLECTION].update_one(
                {"email": email},
                {
                    "$set": {
                        "otp_code": otp_code,
                        "otp_expires_at": expires_at,
                        "otp_requested_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )
        except Exception as exc:
            logger.error("OTP issue — DB write failed for %s: %s", email, exc)
            raise DatabaseError() from exc

        logger.info("OTP issued for %s (expires %s)", email, expires_at)
        return otp_code

    # ── Verify ────────────────────────────────────────────────────────────────

    @classmethod
    async def verify_otp(cls, email: str, otp: str) -> None:
        """
        Validate the provided OTP against the stored record.

        On success marks the user as `is_verified = True` and clears OTP fields.

        Raises:
            UserNotFoundError: If no user with the given email exists.
            AccountAlreadyVerifiedError: If the account is already verified.
            OtpNotRequestedError: If no OTP was ever issued for this user.
            OtpExpiredError: If the OTP has passed its expiry time.
            OtpInvalidError: If the OTP doesn't match.
            DatabaseError: On unexpected MongoDB errors.
        """
        db = Database.get_db()

        try:
            user = await db[cls.COLLECTION].find_one({"email": email})
        except Exception as exc:
            logger.error("OTP verify — DB read failed for %s: %s", email, exc)
            raise DatabaseError() from exc

        if user is None:
            raise UserNotFoundError()

        if user.get("is_verified", False):
            raise AccountAlreadyVerifiedError()

        stored_otp: str | None = user.get("otp_code")
        expires_at: datetime | None = user.get("otp_expires_at")

        if stored_otp is None or expires_at is None:
            raise OtpNotRequestedError()

        # Make expires_at timezone-aware if stored without tzinfo
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            raise OtpExpiredError()

        if otp != stored_otp:
            raise OtpInvalidError()

        # Mark verified and clear OTP fields
        try:
            await db[cls.COLLECTION].update_one(
                {"email": email},
                {
                    "$set": {
                        "is_verified": True,
                        "updated_at": datetime.now(timezone.utc),
                    },
                    "$unset": {
                        "otp_code": "",
                        "otp_expires_at": "",
                        "otp_requested_at": "",
                    },
                },
            )
        except Exception as exc:
            logger.error("OTP verify — DB update failed for %s: %s", email, exc)
            raise DatabaseError() from exc

        logger.info("Account verified for %s", email)
