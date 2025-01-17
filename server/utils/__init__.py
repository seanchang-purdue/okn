# utils/__init__.py
from .data_loader import DataLoader
from .draw import *
from typing import Dict, Any

class UtilsConfig:
    """Configuration for utilities"""
    DEFAULT_DATA_PATH = './data'
    DEFAULT_FEATURE_LIST_PATH = './feature_list.txt'

# You can add utility functions that might be needed across the application
def get_project_root() -> str:
    """Returns the root directory of the project"""
    import os
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

__all__ = [
    'DataLoader',
    'UtilsConfig',
    'get_project_root',
]
