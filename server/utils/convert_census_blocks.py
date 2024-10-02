import json
import os

def convert_polygons_to_geojson(data):
    features = []
    for id, coordinates in data.items():
        swapped_coordinates = [[coord[1], coord[0]] for coord in coordinates]
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [swapped_coordinates]
            },
            "properties": {
                "id": id
            }
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }

if __name__ == "__main__":
    # Get the current file's directory (assuming this script is in the 'utils' folder)
    current_dir = os.path.dirname(__file__)

    # Go up one level to the parent directory of 'utils'
    parent_dir = os.path.dirname(current_dir)

    # Construct the path to the 'data' directory and the 'census_blocks.json' file
    input_file_path = os.path.join(parent_dir, 'data', 'census_blocks.json')
    with open(input_file_path, 'r') as file:
        polygon_data = json.load(file)

    geojson = convert_polygons_to_geojson(polygon_data)

    # Define the output file path
    write_file_path = os.path.join(parent_dir, 'data', 'census_blocks_geojson.json')

    # Write the GeoJSON to a file
    with open(write_file_path, 'w') as file:
        json.dump(geojson, file, indent=4)

    print(f"GeoJSON file has been created at: {write_file_path}")
