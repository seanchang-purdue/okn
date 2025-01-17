# server/core/models/model.py
import pandas as pd

class DataModel:
    def __init__(self, data_path: str, kg_path: str):
        """
        Initialize the DataModel with paths to both main data and knowledge graph data.
        
        Args:
            data_path (str): Path to the main data CSV file
            kg_path (str): Path to the knowledge graph CSV file
        """
        self.filepath = data_path
        self.kg_path = kg_path
        self.data = self.load_data()
        self.kg = self.load_kg_data()

    def load_data(self) -> pd.DataFrame:
        """
        Load the main data from the CSV file.

        Returns:
            pd.DataFrame: The loaded data
        """
        if self.filepath is not None:
            df = pd.read_csv(self.filepath)
            df.dropna(inplace=True)
            return df
        return None

    def load_kg_data(self) -> pd.DataFrame:
        """
        Load the knowledge graph data from the CSV file.

        Returns:
            pd.DataFrame: The loaded knowledge graph data
        """
        if self.kg_path is not None:
            df = pd.read_csv(self.kg_path)
            df.dropna(inplace=True)
            return df
        return None