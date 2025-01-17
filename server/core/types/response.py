# types/response.py
from typing import TypedDict, Any, Union
from flask import Response

class ApiResponse(TypedDict):
    success: bool
    data: Any | None
    error: str | None
    timestamp: str

FlaskResponse = Union[Response, tuple[Response, int]]
