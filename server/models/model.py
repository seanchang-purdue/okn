##################################################
# Description: This model is for loading the data
# and performing the analysis.
##################################################
import pandas as pd

class DataModel:
    def __init__(self, data_path):
        self.filepath = data_path
        self.data = self.load_data()

    def load_data(self):
        """
        Load the data from the CSV file.

        Returns:
        DataFrame: The loaded data.
        """
        data = pd.read_csv(self.filepath)
        data.dropna(inplace=True)
        return data

# Test the DataModel class
if __name__ == '__main__':
    data_model = DataModel('alignment_shooting.csv')
    print(data_model.data.head())