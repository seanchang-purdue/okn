import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

import folium
from folium.plugins import HeatMap

matplotlib.pyplot.switch_backend('Agg') 

def create_shooting_heatmap_on_map(data, start_date, end_date, feature_filters=None):
    """
    Create an interactive heatmap of shootings on an actual map for a specific time range, with optional feature filters.

    Parameters:
    data (DataFrame): The dataframe containing the shooting data.
    start_date (str): The start date for the analysis (YYYY-MM-DD format).
    end_date (str): The end date for the analysis (YYYY-MM-DD format).
    feature_filters (dict, optional): A dictionary for additional filtering, where keys are column names and values are lists of selected values for each feature.

    Returns:
    folium.Map: A Folium Map object containing the heatmap.
    """
    # Set default values for feature_filters if None
    if feature_filters is None:
        feature_filters = {}

    # Filter data based on the feature filters
    for feature, values in feature_filters.items():
        data = data[data[feature].isin(values)]

    # Filter data based on the date range
    if start_date and end_date:
        data['date_'] = pd.to_datetime(data['date_'])
        mask = (data['date_'] >= start_date) & (data['date_'] <= end_date)
        filtered_data = data.loc[mask]
    else:
        filtered_data = data

    # Create a base map
    map_center = [filtered_data['lat'].mean(), filtered_data['lng'].mean()]
    map = folium.Map(location=map_center, zoom_start=12)

    # Create a heatmap layer
    heatmap_data = filtered_data[['lat', 'lng']].values.tolist()
    HeatMap(heatmap_data).add_to(map)

    return map

# Example usage of the function
# feature_filters = {'race': ['B', 'W']} # Optional
# heatmap_map = create_shooting_heatmap_on_map(data, '2023-01-01', '2023-12-31', feature_filters)
# heatmap_map.save('heatmap.html')  # Save to an HTML file


def plot_shooting_heatmap(data, start_date, end_date, feature_filters=None):
    """
    Create a heatmap of shootings for a specific time range, with optional feature filters.

    Parameters:
    data (DataFrame): The dataframe containing the shooting data.
    start_date (str): The start date for the analysis (YYYY-MM-DD format).
    end_date (str): The end date for the analysis (YYYY-MM-DD format).
    feature_filters (dict, optional): A dictionary for additional filtering, where keys are column names and values are lists of selected values for each feature.

    Returns:
    matplotlib.figure.Figure: The figure object containing the heatmap.
    """
    # Set default values for feature_filters if None
    if feature_filters is None:
        feature_filters = {}

    # Filter data based on the feature filters
    for feature, values in feature_filters.items():
        data = data[data[feature].isin(values)]

    # Filter data based on the date range
    if start_date and end_date:
        data['date_'] = pd.to_datetime(data['date_'])
        mask = (data['date_'] >= start_date) & (data['date_'] <= end_date)
        filtered_data = data.loc[mask]
    else:
        filtered_data = data

    # Convert DataFrame to GeoDataFrame
    gdf = gpd.GeoDataFrame(filtered_data, geometry=gpd.points_from_xy(filtered_data.lng, filtered_data.lat))

    # Creating the heatmap
    fig, ax = plt.subplots(figsize=(10, 6))
    gdf.plot(ax=ax, marker='o', color='red', markersize=5)
    sns.kdeplot(x=gdf['lng'], y=gdf['lat'], ax=ax, cmap="Reds", shade=True, alpha=0.5)

    ax.set_title('Heatmap of Shootings')
    ax.set_xlabel('Longitude')
    ax.set_ylabel('Latitude')
    plt.tight_layout()

    return fig

# Example usage of the function
# feature_filters = {'race': ['B', 'W']} # Optional
# fig = plot_shooting_heatmap(data, '2023-01-01', '2023-12-31', feature_filters)
# fig.show()


def plot_time_series(data, start_date, end_date, census_blocks=None, feature_filters=None, bbox=None, interval='M'):
    """
    Create a time series plot of the number of shootings based on specified feature filters, 
    a bounding box, and return the figure.

    Parameters:
    data (DataFrame): The dataframe containing the shooting data.
    start_date (str): The start date for the analysis (YYYY-MM-DD format).
    end_date (str): The end date for the analysis (YYYY-MM-DD format).
    census_blocks (list of int, optional): List of census block numbers for filtering.
    feature_filters (dict, optional): A dictionary where keys are column names and values are lists of selected values for each feature.
    bbox (tuple, optional): A tuple of (min_x, min_y, max_x, max_y) representing the bounding box for filtering by geographical coordinates.
    interval (str): The time interval for analysis ('M' for monthly, 'Y' for yearly).

    Returns:
    dict: A dictionary with dates as keys and counts as values.
    """
    if 'date_' not in data.columns:
        raise ValueError("DataFrame must contain a 'date_' column")
    
    # Ensure the date column is in datetime format and set as index if not already
    if not pd.api.types.is_datetime64_any_dtype(data['date_']):
        data['date_'] = pd.to_datetime(data['date_'])
        data.set_index('date_', inplace=True, drop=False)  # Use drop=False to keep the column

    try:
        # Attempt to infer a frequency, if possible
        data.index = pd.DatetimeIndex(data.index, freq='infer')
    except ValueError:
        # If inference fails, fallback to not setting a frequency
        data.index = pd.DatetimeIndex(data.index)

    # Set default value for feature_filters if None
    if feature_filters is None:
        feature_filters = {}

    # Filter data based on the feature filters
    for feature, values in feature_filters.items():
        data = data[data[feature].isin(values)]

    # Filter data based on the bounding box if provided
    if bbox:
        min_x, min_y, max_x, max_y = bbox
        data = data[(data['point_x'] >= min_x) & (data['point_x'] <= max_x) &
                    (data['point_y'] >= min_y) & (data['point_y'] <= max_y)]

    # Ensure the date column is in datetime format
    data['date_'] = pd.to_datetime(data['date_'])

    # Filter data based on the census blocks if provided
    if census_blocks:
        data = data[data['Census track'].isin(census_blocks)]

    # Filter data based on the provided date range
    if start_date and end_date:
        mask = (data['date_'] >= start_date) & (data['date_'] <= end_date)
        filtered_data = data.loc[mask]
    else:
        filtered_data = data

    # Resample the data based on the specified interval
    resampled_data = filtered_data.resample(interval).size()

    # Convert to dictionary with date as key and count as value
    json_serializable_data = {date.strftime('%Y-%m-%d'): count for date, count in resampled_data.items()}
    return json_serializable_data


    # # Creating the figure
    # fig, ax = plt.subplots(figsize=(10, 6))
    # sns.lineplot(data=resampled_data, ax=ax)
    # ax.set_title('Number of Shootings Over Time')
    # ax.set_xlabel('Date')
    # ax.set_ylabel('Number of Shootings')
    # plt.xticks(rotation=45)
    # plt.tight_layout()

    # return fig

# Example usage of the function
# feature_filters = {'race': ['B', 'W'], 'sex': ['M']} # Optional
# bbox = (-75.25, 39.90, -75.10, 39.95) # Optional
# fig = plot_time_series(data, '2023-01-01', '2023-12-31', feature_filters, bbox, interval='M')
# fig.show()

def plot_demographic_analysis(data, demographic_feature, census_blocks=None, analysis_type='count', feature_filters=None, start_date=None, end_date=None, bbox=None):
    """
    Create a plot for demographic analysis of shootings based on a specified demographic feature, with time and location filters.

    Parameters:
    data (DataFrame): The dataframe containing the shooting data.
    demographic_feature (str): The demographic feature to analyze (e.g., 'race', 'sex').
    analysis_type (str): The type of analysis ('count', 'mean', etc.).
    feature_filters (dict, optional): A dictionary for additional filtering, where keys are column names and values are lists of selected values for each feature.
    start_date (str, optional): The start date for the analysis (YYYY-MM-DD format).
    end_date (str, optional): The end date for the analysis (YYYY-MM-DD format).
    bbox (tuple, optional): A tuple of (min_x, min_y, max_x, max_y) representing the bounding box for filtering by geographical coordinates.

    Returns:
    dict: A dictionary with demographic feature values as keys and counts (or other analysis results) as values.
    """
    # Set default values for feature_filters if None
    if feature_filters is None:
        feature_filters = {}

    # Filter data based on the feature filters
    for feature, values in feature_filters.items():
        data = data[data[feature].isin(values)]

    # Filter data based on the date range if provided
    if start_date and end_date:
        data['date_'] = pd.to_datetime(data['date_'])
        mask = (data['date_'] >= start_date) & (data['date_'] <= end_date)
        data = data.loc[mask]

    # Filter data based on the bounding box if provided
    if bbox:
        min_x, min_y, max_x, max_y = bbox
        data = data[(data['point_x'] >= min_x) & (data['point_x'] <= max_x) &
                    (data['point_y'] >= min_y) & (data['point_y'] <= max_y)]
        
    # Filter data based on the census blocks if provided
    if census_blocks:
        data = data[data['Census track'].isin(census_blocks)]

    # Perform the analysis
    if analysis_type == 'count':
        analysis_result = data[demographic_feature].value_counts()
    else:
        # Extend this part for other types of analyses like mean, etc.
        analysis_result = data[demographic_feature].value_counts()  # Placeholder

    return analysis_result.to_dict()

    # # Creating the figure
    # fig, ax = plt.subplots(figsize=(10, 6))
    # analysis_result.plot(kind='bar', ax=ax)
    # ax.set_title(f'Demographic Analysis based on {demographic_feature}')
    # ax.set_xlabel(demographic_feature)
    # ax.set_ylabel(analysis_type.capitalize())
    # plt.xticks(rotation=45)
    # plt.tight_layout()

    # return fig

# Example usage of the function
# feature_filters = {'race': ['B', 'W']} # Optional
# bbox = (-75.25, 39.90, -75.10, 39.95) # Optional
# fig = plot_demographic_analysis(data, 'sex', 'count', feature_filters, '2023-01-01', '2023-12-31', bbox)
# fig.show()



if __name__ == '__main__':
    data = pd.read_csv('alignment_shooting.csv')
    # drop the rows with missing or NaN values34
    data.dropna(inplace=True)
    # feature_filters = {'race': ['B', 'W']} # Optional
    heatmap_map = create_shooting_heatmap_on_map(data, '2023-01-01', '2023-12-31', feature_filters=None)
    heatmap_map.save('heatmap.html')  # Save to an HTML file

    # save line chart fig
    fig = plot_time_series(data, '2023-01-01', '2023-12-31', feature_filters=None, bbox=None, interval='M')
    fig.savefig('static/images/line.png')