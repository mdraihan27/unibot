"""
Security utilities — password hashing and JWT token management.
"""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from app.config.settings import settings

# ── Password hashing ──────────────────────────────────────────────────────────
#
# We use bcrypt directly (not via passlib) because passlib 1.7.4 is incompatible
# with bcrypt 4+: it tries to access bcrypt.__about__.__version__ which was
# removed, and its internal wrap-bug detection hashes a >72-byte password that
# bcrypt 5+ now rejects.
#
# bcrypt has a hard 72-byte limit on plaintext. We pre-hash with SHA-256 so
# arbitrarily long passwords work correctly without truncation.


def _prepare(plain: str) -> bytes:
    """SHA-256 pre-hash then encode for bcrypt — removes the 72-byte limit."""
    return hashlib.sha256(plain.encode("utf-8")).hexdigest().encode("utf-8")


class PasswordHelper:
    """Handles bcrypt hashing and verification."""

    @staticmethod
    def hash(plain: str) -> str:
        """Return a bcrypt hash of the plaintext password."""
        hashed = bcrypt.hashpw(_prepare(plain), bcrypt.gensalt(rounds=12))
        return hashed.decode("utf-8")

    @staticmethod
    def verify(plain: str, hashed: str) -> bool:
        """Return True if `plain` matches the stored `hashed` value."""
        try:
            return bcrypt.checkpw(_prepare(plain), hashed.encode("utf-8"))
        except Exception:
            return False


# ── JWT tokens ────────────────────────────────────────────────────────────────

class JWTHelper:
    """Creates and decodes JWT access / refresh tokens."""

    # ── Access token ─────────────────────────────────────────────────────────

    @staticmethod
    def create_access_token(subject: str) -> str:
        """
        Create a short-lived JWT access token.

        Args:
            subject: Typically the user's email or user ID.
        """
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
        payload = {
            "sub": subject,
            "exp": expire,
            "type": "access",
        }
        return jwt.encode(
            payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )

    # ── Refresh token ─────────────────────────────────────────────────────────

    @staticmethod
    def create_refresh_token(subject: str) -> str:
        """
        Create a long-lived JWT refresh token.

        Args:
            subject: Typically the user's email or user ID.
        """
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        )
        payload = {
            "sub": subject,
            "exp": expire,
            "type": "refresh",
        }
        return jwt.encode(
            payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )

    # ── Decode ────────────────────────────────────────────────────────────────

    @staticmethod
    def decode(token: str) -> Optional[dict]:
        """
        Decode a JWT token.

        Returns:
            The decoded payload dict, or None if invalid / expired.
        """
        try:
            return jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except JWTError:
            return None
