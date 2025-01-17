# server/core/models/__init__.py
from .model import DataModel
from typing import Optional, Dict, Any

class ModelRegistry:
    """Registry for keeping track of loaded models"""
    _models: Dict[str, Any] = {}

    @classmethod
    def register(cls, name: str, model: Any) -> None:
        cls._models[name] = model

    @classmethod
    def get(cls, name: str) -> Optional[Any]:
        return cls._models.get(name)

__all__ = [
    'DataModel',
    'ModelRegistry'
]
