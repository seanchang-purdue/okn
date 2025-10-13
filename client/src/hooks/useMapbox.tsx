// src/hooks/useMapbox.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { selectedCensusBlocks } from "../stores/censusStore";
import {
  initializeMap,
  setupMapSources,
  setupMapLayers,
  setupMapEvents,
} from "../utils/map/mapbox";
import {
  updateCensusVisibility,
  updateCensusSelection,
} from "../utils/map/mapUpdates";
import { wsState } from "../stores/websocketStore";

// Update the interface to include the onShowCensusData callback
interface MapboxOptions {
  center?: [number, number];
  zoom?: number;
  onShowCensusData?: (geoid: string) => void;
}

const useMapbox = (options: MapboxOptions = {}) => {
  const mapContainer = useRef<HTMLDivElement>(null!);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const selectedBlocks = useStore(selectedCensusBlocks);
  const [censusLayersVisible, setCensusLayersVisible] = useState(false);

  // Extract onShowCensusData from options
  const { onShowCensusData, ...mapOptions } = options;

  const toggleCensusLayers = useCallback(() => {
    setCensusLayersVisible((prev) => !prev);
  }, []);

  const updateGeoJSON = useCallback(
    (data: GeoJSON.FeatureCollection) => {
      if (mapInstanceRef.current && isLoaded) {
        const source = mapInstanceRef.current.getSource(
          "shooting"
        ) as mapboxgl.GeoJSONSource;
        source?.setData(data);
      }
    },
    [isLoaded]
  );

  const updateShootingData = useCallback(
    (data: GeoJSON.FeatureCollection) => {
      if (mapInstanceRef.current && isLoaded) {
        const map = mapInstanceRef.current;
        const source = map.getSource("shooting") as mapboxgl.GeoJSONSource;
        // Fast path: just update source; Mapbox updates layers automatically
        source?.setData(data);
      }
    },
    [isLoaded]
  );

  // Add effect to watch websocket state
  const websocketState = useStore(wsState);
  useEffect(() => {
    if (websocketState.geoJSONData) {
      updateShootingData(websocketState.geoJSONData);
    }
  }, [websocketState.geoJSONData, updateShootingData]);

  // Initialize map
  useEffect(() => {
    if (mapContainer.current && !mapInstanceRef.current) {
      const initMap = async () => {
        try {
          // Initialize map with the map-specific options
          mapInstanceRef.current = initializeMap(
            mapContainer.current,
            mapOptions
          );

          // Wait for map to load
          await new Promise<void>((resolve) => {
            mapInstanceRef.current!.on("load", () => {
              resolve();
            });
          });

          // Setup sources and layers
          if (mapInstanceRef.current) {
            await setupMapSources(mapInstanceRef.current);
            setupMapLayers(mapInstanceRef.current);

            // Pass the onShowCensusData callback to setupMapEvents
            setupMapEvents(
              mapInstanceRef.current,
              selectedCensusBlocks,
              onShowCensusData
            );

            // Only set isLoaded after everything is setup
            setIsLoaded(true);
          }
        } catch (error) {
          console.error("Error initializing map:", error);
        }
      };

      initMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsLoaded(false);
      }
    };
  }, [JSON.stringify(mapOptions), onShowCensusData]);

  // Update census block selection
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      updateCensusSelection(mapInstanceRef.current, selectedBlocks);
    }
  }, [selectedBlocks, isLoaded]);

  // Update census layer visibility
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      updateCensusVisibility(mapInstanceRef.current, censusLayersVisible);
    }
  }, [censusLayersVisible, isLoaded]);

  return {
    mapContainer,
    map: mapInstanceRef.current,
    isLoaded,
    toggleCensusLayers,
    censusLayersVisible,
    updateGeoJSON,
    updateShootingData,
  };
};

export default useMapbox;
