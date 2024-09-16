import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { GeoJSONFeature } from "mapbox-gl";

// Type guard to check if the geometry has coordinates
function hasCoordinates(
  geometry: GeoJSON.Geometry,
): geometry is
  | GeoJSON.Point
  | GeoJSON.MultiPoint
  | GeoJSON.LineString
  | GeoJSON.MultiLineString
  | GeoJSON.Polygon
  | GeoJSON.MultiPolygon {
  return "coordinates" in geometry;
}

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:12345";

const useMapbox = (
  options: Object = {},
): {
  mapContainer: React.RefObject<HTMLDivElement>;
  map: mapboxgl.Map | null;
  isLoaded: boolean;
} => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapboxgl.accessToken) {
      mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;
    }

    if (mapContainer.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        ...options,
      });

      mapInstanceRef.current.on("load", () => {
        setIsLoaded(true);

        mapInstanceRef.current?.addSource("shooting", {
          type: "geojson",
          data: `${serverUrl}/heatmap-geopoints`,
          // data: "https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson",
        });

        mapInstanceRef.current?.addLayer({
          id: "shooting-heat",
          type: "heatmap",
          source: "shooting",
          paint: {
            // Increase the heatmap color weight weight by zoom level
            // heatmap-intensity is a multiplier on top of heatmap-weight
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              1,
              9,
              3,
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(255,0,255,0)",
              0.25,
              "rgba(0,0,255,0.6)",
              0.5,
              "rgba(0,255,0,0.6)",
              0.75,
              "rgba(255,255,0,0.6)",
              1,
              "rgba(255,0,0, 0.6)",
            ],
            // Adjust the heatmap radius by zoom level
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              5,
              9,
              15,
            ],
            // heatmap opacity for transition to circle layer
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              0,
              7,
              1,
              13,
              0,
            ],
          },
        });

        // circle layer after zoom level 12.5
        mapInstanceRef.current?.addLayer({
          id: "shooting-point",
          type: "circle",
          source: "shooting",
          minzoom: 13,
          paint: {
            // increase the radius of the circle as the zoom level and dbh value increases
            "circle-radius": {
              property: "dbh",
              type: "exponential",
              stops: [
                [{ zoom: 15, value: 1 }, 5],
                [{ zoom: 15, value: 62 }, 10],
                [{ zoom: 22, value: 1 }, 20],
                [{ zoom: 22, value: 62 }, 50],
              ],
            },
            "circle-color": {
              property: "dbh",
              type: "exponential",
              stops: [
                [0, "rgba(236,222,239,0)"],
                [10, "rgb(236,222,239)"],
                [20, "rgb(208,209,230)"],
                [30, "rgb(166,189,219)"],
                [40, "rgb(103,169,207)"],
                [50, "rgb(28,144,153)"],
                [60, "rgb(1,108,89)"],
              ],
            },
            "circle-stroke-color": "white",
            "circle-stroke-width": 1,
            "circle-opacity": {
              stops: [
                [13, 0],
                [15, 1],
              ],
            },
          },
        });

        // add a tooltip to the circle layer
        mapInstanceRef.current?.on("click", "shooting-point", (e) => {
          if (!e.features) return;

          const feature = e.features[0] as GeoJSONFeature;
          const geometry = feature.geometry;

          if (!hasCoordinates(geometry)) return;

          console.log(geometry.coordinates);

          new mapboxgl.Popup({ className: "text-black" })
            .setLngLat(geometry.coordinates as mapboxgl.LngLatLike)
            .setHTML(
              `<p>
                <span>Date: ${feature.properties?.date}</span>
                <br/>
                <span>Killed: ${feature.properties?.killed}</span>
                <br/>
                <span>Injured: ${feature.properties?.injured}</span>
                <br/>
                <span>Incident: <a target="_blank" style="color: blue;" href="${feature.properties?.incident}">learn more</a></span>
                <br/>
                <span>Source: <a target="_blank" style="color: blue;" href="${feature.properties?.source}">learn more</a></span>
              </p>`
            )
            .addTo(mapInstanceRef.current as mapboxgl.Map);
        });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsLoaded(false);
      }
    };
  }, [JSON.stringify(options)]);

  return { mapContainer, map: mapInstanceRef.current, isLoaded };
};

export default useMapbox;
