# utils/data_loader.py
import os
import json
from server.core.models.model import DataModel
from server.core.types import DataStore

class DataLoader:
    def __init__(self, base_path: str = '.'):
        self.base_path = base_path
        
    def load_data(self) -> DataStore:
        """Load all required data files and return as DataStore"""
        # Load model data
        data_model = DataModel(os.path.join(self.base_path, 'data/alignment_shooting.csv'))
        
        # Load feature list
        feature_list_path = os.path.join(self.base_path, 'feature_list.txt')
        with open(feature_list_path, 'r') as file:
            feature_list = file.read().split('\n')
            
        # Load heatmap data
        heatmap_path = os.path.join(self.base_path, 'data/heatmap_geopoints.json')
        with open(heatmap_path, 'r') as file:
            heatmap_data = json.load(file)
            
        # Load census block data
        census_path = os.path.join(self.base_path, 'data/census_blocks_geojson.json')
        with open(census_path, 'r') as file:
            census_block_data = json.load(file)
            
        return {
            'data_model': data_model,
            'feature_list': feature_list,
            'heatmap_data': heatmap_data,
            'census_block_data': census_block_data
        }
