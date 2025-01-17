# server/core/data/loader.py
import os
import json
from typing import Dict, Any
from ..models.model import DataModel
from ..types import DataStore

class DataLoader:
    def __init__(self, base_path: str = '.'):
        self.base_path = base_path
        
    def load_data(self) -> DataStore:
        """Load all required data files and return as DataStore"""
        return {
            'data_model': self._load_model_data(),
            'feature_list': self._load_feature_list(),
            'heatmap_data': self._load_heatmap_data(),
            'census_block_data': self._load_census_data(),
        }
    
    def _load_model_data(self) -> DataModel:
        """Load and return the data model"""
        data_path = os.path.join(self.base_path, 'core/data/resources/raw/alignment_shooting.csv')
        kg_path = os.path.join(self.base_path, 'core/data/resources/processed/assemble_kg.csv')
        return DataModel(data_path=data_path, kg_path=kg_path)
    
    def _load_feature_list(self) -> list[str]:
        """Load and return the feature list"""
        path = os.path.join(self.base_path, 'core/data/resources/config/feature_list.txt')
        with open(path, 'r') as file:
            return file.read().split('\n')
    
    def _load_heatmap_data(self) -> Dict[str, Any]:
        """Load and return heatmap data"""
        path = os.path.join(self.base_path, 'core/data/resources/processed/heatmap_geopoints.json')
        with open(path, 'r') as file:
            return json.load(file)
    
    def _load_census_data(self) -> Dict[str, Any]:
        """Load and return census block data"""
        path = os.path.join(self.base_path, 'core/data/resources/processed/census_blocks_geojson.json')
        with open(path, 'r') as file:
            return json.load(file)
