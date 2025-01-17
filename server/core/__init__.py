# server/core/__init__.py
from pathlib import Path
from typing import Dict, Any

# Export core components
from .controllers import LineChartController, DemographicController
from .models import DataModel
from .types import (
    DataStore,
    FlaskResponse,
    ApiResponse,
    ChartRequest,
    DemographicRequest
)
from .data.loader import DataLoader

# Core configuration
CORE_DIR = Path(__file__).parent
DATA_DIR = CORE_DIR / 'data' / 'resources'

class CoreConfig:
    """Core package configuration"""
    DATA_PATHS: Dict[str, Path] = {
        'raw': DATA_DIR / 'raw',
        'processed': DATA_DIR / 'processed',
        'config': DATA_DIR / 'config',
        'temp': DATA_DIR / 'temp'
    }
    
    DEFAULT_FEATURES_PATH = DATA_PATHS['config'] / 'feature_list.txt'
    DEFAULT_MODEL_PATH = DATA_PATHS['raw'] / 'alignment_shooting.csv'

def initialize_core() -> None:
    """Initialize core package components"""
    # Ensure data directories exist
    for path in CoreConfig.DATA_PATHS.values():
        path.mkdir(parents=True, exist_ok=True)

def get_data_loader() -> DataLoader:
    """Get configured data loader instance"""
    return DataLoader(base_path=str(DATA_DIR))

# Initialize core package when imported
initialize_core()

# Define what should be available when using 'from server.core import *'
__all__ = [
    # Controllers
    'LineChartController',
    'DemographicController',
    
    # Models
    'DataModel',
    
    # Types
    'DataStore',
    'FlaskResponse',
    'ApiResponse',
    'ChartRequest',
    'DemographicRequest',
    
    # Data Management
    'DataLoader',
    'get_data_loader',
    
    # Configuration
    'CoreConfig',
    'CORE_DIR',
    'DATA_DIR',
]
