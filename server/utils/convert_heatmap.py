import json
import os
import csv
from datetime import datetime

class CustomEncoder(json.JSONEncoder):
    def iterencode(self, obj, _one_shot=False):
        if isinstance(obj, list) and len(obj) > 0 and isinstance(obj[0], dict) and "type" in obj[0]:
            yield '[\n'
            first = True
            for value in obj:
                if not first:
                    yield ',\n\n'  # Add an extra newline here
                else:
                    first = False
                yield from json.JSONEncoder.iterencode(self, value)
            yield '\n]'
        else:
            yield from super().iterencode(obj, _one_shot)

def convertPointsToGeoJson(data):
    features = []
    for row in data:
        # Extract date and time
        date_part = row['date_'].split()[0]  # Take only the date part
        time_part = row['time'].strip()  # Remove any leading/trailing whitespace
        
        # Use a default time if the time field is empty
        if not time_part:
            time_part = '00:00:00'
        
        datetime_str = f"{date_part} {time_part}"
        
        try:
            datetime_obj = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
            # Format the datetime with a space between date and time
            formatted_datetime = datetime_obj.strftime('%Y-%m-%d %H:%M:%S')
        except ValueError as e:
            print(f"Error parsing date: {e}")
            print(f"Problematic date string: {datetime_str}")
            print(f"Original date_: {row['date_']}, time: {row['time']}")
            continue

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(row['point_x']), float(row['point_y'])]  # [longitude, latitude]
            },
            "properties": {
                "datetime": formatted_datetime,  # Use the formatted datetime string
                "race": row['race'],
                "sex": row['sex'],
                "age": row['age'],
                "fatal": row['fatal'],
                "census_track": row['Census track']
            }
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }

if __name__ == "__main__":
    file_path = "/Users/seanochang/Desktop/purdue/OKN-Project/server/alignment_shooting.csv"
    write_file_path = os.path.join(os.path.dirname(__file__), 'heatmap_geopoints.json')

    data = []

    with open(file_path, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            point_x = row.get('point_x', '').strip()
            point_y = row.get('point_y', '').strip()
            if point_x and point_y:  # Check if both values exist and are not empty
                try:
                    float(point_x)
                    float(point_y)
                    data.append(row)
                except ValueError:
                    print(f"Invalid coordinates: x={point_x}, y={point_y}")

    geojson = convertPointsToGeoJson(data)

    with open(write_file_path, 'w', encoding='utf-8') as file:
        json.dump(geojson, file, cls=CustomEncoder, indent=4, ensure_ascii=False)

    print(f"Processed {len(data)} valid entries.")
    print(f"GeoJSON file created at: {write_file_path}")
