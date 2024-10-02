import json
import os
import csv

def convertPointsToGeoJson(data):
    features = []
    for data in data:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [data[1], data[0]]  # [longitude, latitude]
            },
            "properties": {
                "killed": data[2],
                "injured": data[3],
                "incident": data[4],
                "source": data[5],
                "date": data[6]
            }
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }

if __name__ == "__main__":
    file_path = "/Users/seanochang/Desktop/purdue/OKN-Project/server/data/gun-violence-data_01-2013_03-2018.csv"
    write_file_path = os.path.join(os.path.dirname(__file__), 'full_heatmap_geopoints.json')

    data = []

    with open(file_path, 'r') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            lat = row['latitude']
            long = row['longitude']
            killed = row['n_killed']
            injured = row['n_injured']
            incident = row['incident_url']
            source = row['source_url']
            date = row['date']
            if lat and long:  # Check if both values exist
                data.append((float(lat), float(long), int(killed), int(injured), incident, source, date))

    geojson = convertPointsToGeoJson(data)

    with open(write_file_path, 'w') as file:
        json.dump(geojson, file, indent=4)