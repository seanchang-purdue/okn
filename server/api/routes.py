# server/api/routes.py
from flask import Flask
from flask_cors import cross_origin
from core.controllers import LineChartController, DemographicController
from core.types import DataStore
from api.handlers import RouteHandlers
from typing import List, Tuple, Callable
from functools import wraps
from config import Config

class RouteRegistry:
    """Registry for API routes"""
    def __init__(self, app: Flask, data_store: DataStore):
        self.app = app
        self.handlers = RouteHandlers(
            line_controller=LineChartController(data_store['data_model']),
            demographic_controller=DemographicController(data_store['data_model']),
            data_store=data_store
        )
        self.routes: List[Tuple[str, str, Callable, List[str]]] = [
            ('/api/line-chart-data', 'line_chart_data', 
             self.handlers.line_chart_data, ["POST", "OPTIONS"]),
            ('/api/demographic-chart-data', 'demographic_chart_data', 
             self.handlers.demographic_chart_data, ["POST", "OPTIONS"]),
            ('/api/heatmap-geopoints', 'heatmap_geopoints', 
             self.handlers.heatmap_geopoints, ["GET", "OPTIONS"]),
            ('/api/census-block-geopoints', 'census_block_geopoints', 
             self.handlers.census_block_geopoints, ["GET", "OPTIONS"]),
            ('/api/health', 'health_check', 
             self.handlers.health_check, ["GET"])
        ]

    def register_routes(self) -> None:
        """Register all routes with the Flask app"""
        cors_config = {
            'origins': Config.CORS_ORIGINS,
            'methods': ['GET', 'POST', 'OPTIONS'],
            'allow_headers': ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Headers']
        }
        
        for path, endpoint, handler, methods in self.routes:
            # Create a wrapper function to preserve the method attributes
            @wraps(handler)
            def wrapped_handler(*args, **kwargs):
                return handler(*args, **kwargs)
            
            # Apply CORS if it's an API route
            if path.startswith('/api/'):
                wrapped_handler = cross_origin(**cors_config)(wrapped_handler)
            
            self.app.add_url_rule(
                path,
                endpoint,
                wrapped_handler,
                methods=methods
            )

def register_routes(app: Flask, data_store: DataStore) -> None:
    """Register all routes with the Flask app"""
    registry = RouteRegistry(app, data_store)
    registry.register_routes()
