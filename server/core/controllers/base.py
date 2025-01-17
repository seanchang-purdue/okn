# core/controllers/base.py
from typing import Any, Optional
from flask import jsonify
from datetime import datetime
from ..types import ApiResponse, FlaskResponse
import logging

class BaseController:
    """Base controller with common functionality"""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)

    def api_response(
        self,
        success: bool = True,
        data: Any = None,
        error: str | None = None,
        status_code: int = 200
    ) -> FlaskResponse:
        """Standardize API responses"""
        response: ApiResponse = {
            'success': success,
            'data': data,
            'error': error,
            'timestamp': datetime.utcnow().isoformat()
        }
        return jsonify(response), status_code

    def validate_request_body(self, body: dict) -> Optional[FlaskResponse]:
        """Validate request body"""
        if not body:
            return self.api_response(
                success=False,
                error="Request body is empty",
                status_code=400
            )
        return None

    def parse_census_block(self, census_block: str) -> Any:
        """Parse census block string to appropriate format"""
        import ast
        try:
            return ast.literal_eval(census_block) if isinstance(census_block, str) else census_block
        except (ValueError, SyntaxError):
            raise ValueError("Invalid format for census_block")