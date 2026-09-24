"""
Domain-specific exceptions for the Auth module.

Each exception carries:
  - A machine-readable ``code``  (used in ApiResponse.code)
  - A human-readable  ``message`` (used in ApiResponse.message)
  - An HTTP ``status_code``       (used by the global exception handler)

Add a new class for every distinct error scenario. Never re-use a vague
"AuthError" — that makes client-side error handling impossible.
"""
from http import HTTPStatus


class UnibotBaseException(Exception):
    """Root exception for all Unibot domain errors."""

    code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred. Please try again later."
    status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR.value

    def __init__(self, message: str | None = None):
        self.message = message or self.__class__.message
        super().__init__(self.message)


# ── Registration errors ───────────────────────────────────────────────────────

class EmailAlreadyExistsError(UnibotBaseException):
    """Raised when a registration attempt uses an already-registered email."""
    code = "EMAIL_ALREADY_EXISTS"
    message = (
        "An account with this email address already exists. "
        "Please log in or use a different email."
    )
    status_code = HTTPStatus.CONFLICT.value


class WeakPasswordError(UnibotBaseException):
    """Raised when a password fails the strength policy."""
    code = "WEAK_PASSWORD"
    message = (
        "Password does not meet the security requirements. "
        "It must be at least 8 characters and include uppercase, "
        "lowercase, a digit, and a special character."
    )
    status_code = HTTPStatus.UNPROCESSABLE_ENTITY.value


class PasswordMismatchError(UnibotBaseException):
    """Raised when `password` and `confirm_password` do not match."""
    code = "PASSWORD_MISMATCH"
    message = "Passwords do not match. Please re-enter your password carefully."
    status_code = HTTPStatus.UNPROCESSABLE_ENTITY.value


# ── Login errors ──────────────────────────────────────────────────────────────

class UserNotFoundError(UnibotBaseException):
    """Raised when no user record exists for the provided email."""
    code = "USER_NOT_FOUND"
    message = (
        "No account found with this email address. "
        "Please check the email or create a new account."
    )
    status_code = HTTPStatus.NOT_FOUND.value


class InvalidCredentialsError(UnibotBaseException):
    """Raised when the password does not match the stored hash."""
    code = "INVALID_CREDENTIALS"
    message = (
        "The email or password you entered is incorrect. "
        "Please double-check your credentials and try again."
    )
    status_code = HTTPStatus.UNAUTHORIZED.value


class AccountNotVerifiedError(UnibotBaseException):
    """Raised when a login is attempted on an unverified account."""
    code = "ACCOUNT_NOT_VERIFIED"
    message = (
        "Your account has not been verified yet. "
        "Please check your email for the OTP and verify your account first."
    )
    status_code = HTTPStatus.FORBIDDEN.value


class AccountSuspendedError(UnibotBaseException):
    """Raised when a login is attempted on a suspended account."""
    code = "ACCOUNT_SUSPENDED"
    message = (
        "Your account has been suspended. "
        "Please contact support for assistance."
    )
    status_code = HTTPStatus.FORBIDDEN.value


# ── OTP errors ────────────────────────────────────────────────────────────────

class OtpInvalidError(UnibotBaseException):
    """Raised when the submitted OTP does not match the stored one."""
    code = "OTP_INVALID"
    message = (
        "The OTP you entered is incorrect. "
        "Please check the code and try again."
    )
    status_code = HTTPStatus.UNPROCESSABLE_ENTITY.value


class OtpExpiredError(UnibotBaseException):
    """Raised when the OTP has passed its expiry window."""
    code = "OTP_EXPIRED"
    message = (
        "Your OTP has expired. "
        "Please request a new one and verify within the allowed time."
    )
    status_code = HTTPStatus.GONE.value


class OtpNotRequestedError(UnibotBaseException):
    """Raised when a verify attempt is made but no OTP was ever issued."""
    code = "OTP_NOT_REQUESTED"
    message = (
        "No OTP has been issued for this account. "
        "Please request an OTP first before attempting verification."
    )
    status_code = HTTPStatus.BAD_REQUEST.value


class AccountAlreadyVerifiedError(UnibotBaseException):
    """Raised when OTP verification is attempted on an already-verified account."""
    code = "ACCOUNT_ALREADY_VERIFIED"
    message = (
        "This account is already verified. "
        "You can log in directly without OTP verification."
    )
    status_code = HTTPStatus.CONFLICT.value


# ── Infrastructure errors ─────────────────────────────────────────────────────

class DatabaseError(UnibotBaseException):
    """Raised when a MongoDB operation fails unexpectedly."""
    code = "DATABASE_ERROR"
    message = (
        "A database error occurred while processing your request. "
        "Please try again in a moment. If the issue persists, contact support."
    )
    status_code = HTTPStatus.SERVICE_UNAVAILABLE.value
