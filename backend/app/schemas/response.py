"""
Standardised API response envelope.

Every endpoint returns:
{
    "success": true | false,
    "message": "Human-readable description",
    "code":    "MACHINE_READABLE_CODE",
    "data":    { ... }   # optional
}
"""
from typing import Any, Optional

from pydantic import BaseModel


class ApiResponse(BaseModel):
    """Universal API response wrapper."""

    success: bool
    message: str
    code: str
    data: Optional[Any] = None

    @classmethod
    def ok(
        cls,
        message: str,
        code: str = "SUCCESS",
        data: Optional[Any] = None,
    ) -> "ApiResponse":
        """Convenience constructor for a successful response."""
        return cls(success=True, message=message, code=code, data=data)

    @classmethod
    def fail(
        cls,
        message: str,
        code: str,
        data: Optional[Any] = None,
    ) -> "ApiResponse":
        """Convenience constructor for a failed response."""
        return cls(success=False, message=message, code=code, data=data)
