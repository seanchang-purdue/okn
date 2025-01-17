# types/data.py
from typing import TypedDict, Any
from core.models.model import DataModel

class DataStore(TypedDict):
    data_model: DataModel
    heatmap_data: dict[str, Any]
    census_block_data: dict[str, Any]
    feature_list: list[str]