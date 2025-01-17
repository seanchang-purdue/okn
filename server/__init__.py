# server/__init__.py
from flask import Flask
from typing import Optional
from .api.routes import register_routes
from .core.data.loader import DataLoader
from .config import Config

# Version information
__version__ = '1.0.0'

# Type hints
App = Optional[Flask]

# Singleton pattern for app instance
_app_instance: App = None

def get_app() -> App:
    """Get the current Flask application instance."""
    global _app_instance
    return _app_instance

def create_app(config: Config) -> Flask:
    """Create and configure Flask application."""
    app = Flask(__name__)
    app.config.from_object(config)
    
    # Load data
    data_loader = DataLoader()
    data_store = data_loader.load_data()
    
    # Register routes with data store
    register_routes(app, data_store)
    
    return app

def init_app(config: Config) -> Flask:
    """Initialize and return a new Flask application instance."""
    global _app_instance
    if _app_instance is None:
        _app_instance = create_app(config)
    return _app_instance

__all__ = ['create_app', 'init_app', 'get_app']
