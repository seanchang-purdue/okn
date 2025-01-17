import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import type { GeoJSONFeature } from "mapbox-gl";
import { useStore } from "@nanostores/react";
import { selectedCensusBlocks } from "../stores/censusStore";

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

const serverUrl =
  import.meta.env.PUBLIC_SERVER_URL || "http://localhost:8080/api";

const useMapbox = (
  options: Object = {},
): {
  mapContainer: React.RefObject<HTMLDivElement>;
  map: mapboxgl.Map | null;
  isLoaded: boolean;
  toggleCensusLayers: () => void;
  censusLayersVisible: boolean;
} => {
  const mapContainer = useRef<HTMLDivElement>(null!);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const selectedBlocks = useStore(selectedCensusBlocks);
  const [censusLayersVisible, setCensusLayersVisible] = useState(false);

  const toggleCensusLayers = useCallback(() => {
    setCensusLayersVisible((prev) => !prev);
  }, []);

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

        // Add shooting data to the map
        mapInstanceRef.current?.addSource("shooting", {
          type: "geojson",
          data: `${serverUrl}/heatmap-geopoints`,
          // data: "https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson",
        });

        // Try to add census block data to the map
        mapInstanceRef.current?.addSource("census-blocks", {
          type: "geojson",
          data: `${serverUrl}/census-block-geopoints`,
        });

        // Add the shooting heatmap
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
              0.4, // Lower base intensity
              9,
              1.5, // Lower max intensity
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(0,0,0,0)", // Transparent for lowest values
              0.4,
              "rgba(105,169,255,0.8)", // Light blue
              0.6,
              "rgba(30,220,175,0.8)", // Turquoise
              0.8,
              "rgba(255,218,71,0.8)", // Yellow
              0.9,
              "rgba(255,131,0,0.8)", // Orange
              1,
              "rgba(220,0,0,0.8)", // Less intense red
            ],
            // Adjust the heatmap radius by zoom level
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 2, 4, 5, 7],
            // heatmap opacity for transition to circle layer
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              2,
              0,
              7,
              1,
              16,
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

        // Add census block outline
        mapInstanceRef.current?.addLayer({
          id: "census-block-outline",
          type: "line",
          source: "census-blocks",
          layout: {},
          paint: {
            "line-dasharray": [2, 1],
            "line-color": "rgba(16, 132, 243, 0.5)",
            "line-width": 2,
            "line-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              2,
              0,
              12,
              1,
              15,
              0,
            ],
          },
        });

        // Add census block fill
        mapInstanceRef.current?.addLayer({
          id: "census-blocks-fill",
          type: "fill",
          source: "census-blocks",
          paint: {
            "fill-color": [
              "case",
              ["in", ["get", "id"], ["literal", selectedBlocks]],
              "rgba(16, 132, 243, 0.5)", // Selected color
              "rgba(0, 0, 0, 0)", // Transparent for unselected
            ],
            "fill-outline-color": "rgba(16, 132, 243, 0.5)",
          },
        });

        // add a tooltip to the circle layer
        mapInstanceRef.current?.on("click", "shooting-point", (e) => {
          if (!e.features) return;

          const feature = e.features[0] as GeoJSONFeature;
          const geometry = feature.geometry;

          if (!hasCoordinates(geometry)) return;

          console.log(feature.properties);

          new mapboxgl.Popup({ className: "text-black" })
            .setLngLat(geometry.coordinates as mapboxgl.LngLatLike)
            .setHTML(
              `<p>
              <span>Date: ${feature.properties?.datetime ? new Date(feature.properties.datetime).toLocaleDateString() : ""} </span>
              <br/>
              <span>Time: ${feature.properties?.datetime ? new Date(feature.properties.datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""} </span>
              <br/>
              <span>Race: ${feature.properties?.race}</span>
              <br/>
              <span>Sex: ${feature.properties?.sex}</span>
              <br/>
              <span>Age: ${feature.properties?.age ? parseInt(feature.properties.age) : ""}</span>
              <br/>
              <span>Fatal: ${feature.properties?.fatal === 1.0 ? "Yes" : "No"}</span>
              <br/>
              <span>Census Tract: ${feature.properties?.census_track}</span>
            </p>`,
            )
            .addTo(mapInstanceRef.current as mapboxgl.Map);
        });

        // Add click event for census blocks
        mapInstanceRef.current?.on("click", "census-blocks-fill", (e) => {
          if (!e.features) return;

          const feature = e.features[0] as GeoJSONFeature;
          const blockId = feature.properties?.id as string | undefined;

          if (blockId) {
            console.log(blockId);
            const currentBlocks = selectedCensusBlocks.get();
            if (currentBlocks.includes(blockId)) {
              selectedCensusBlocks.set(
                currentBlocks.filter((id) => id !== blockId),
              );
            } else {
              selectedCensusBlocks.set([...currentBlocks, blockId]);
            }
          }
        });

        // Change cursor to pointer when hovering over census blocks
        mapInstanceRef.current?.on("mouseenter", "census-blocks-fill", () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.getCanvas().style.cursor = "pointer";
          }
        });

        mapInstanceRef.current?.on("mouseleave", "census-blocks-fill", () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.getCanvas().style.cursor = "";
          }
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

  // Update the census blocks layer when selection changes
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      mapInstanceRef.current.setPaintProperty(
        "census-blocks-fill",
        "fill-color",
        [
          "case",
          ["in", ["get", "id"], ["literal", selectedBlocks]],
          "rgba(18, 120, 240, 0.5)", // Selected color
          "rgba(0, 0, 0, 0)", // Transparent for unselected
        ],
      );
    }
  }, [selectedBlocks, isLoaded]);

  // Update the census blocks layer visibility
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      const visibility = censusLayersVisible ? "visible" : "none";
      mapInstanceRef.current.setLayoutProperty(
        "census-block-outline",
        "visibility",
        visibility,
      );
      mapInstanceRef.current.setLayoutProperty(
        "census-blocks-fill",
        "visibility",
        visibility,
      );
    }
  }, [censusLayersVisible, isLoaded]);

  return {
    mapContainer,
    map: mapInstanceRef.current,
    isLoaded,
    toggleCensusLayers,
    censusLayersVisible,
  };
};

export default useMapbox;
