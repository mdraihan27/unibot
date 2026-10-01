from http import HTTPStatus
from app.exceptions.auth import UnibotBaseException


class ConversationNotFoundError(UnibotBaseException):
    code = "CONVERSATION_NOT_FOUND"
    message = "The requested conversation was not found."
    status_code = HTTPStatus.NOT_FOUND.value


class InvalidConversationIdError(UnibotBaseException):
    code = "INVALID_CONVERSATION_ID"
    message = "The provided conversation identifier is invalid."
    status_code = HTTPStatus.BAD_REQUEST.value
