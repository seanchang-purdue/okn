// src/hooks/useMapbox.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { selectedCensusBlocks } from "../stores/censusStore";
import {
  initializeMap,
  setupMapSources,
  setupMapLayers,
  setupMapEvents,
  updateCommunityResourcesData,
  updateBusinessData,
  setBoundaryLayerVisibility,
  type BoundaryVisibilityConfig,
} from "../utils/map/mapbox";
import {
  updateCensusVisibility,
  updateCensusSelection,
} from "../utils/map/mapUpdates";
import { wsState } from "../stores/websocketStore";
import type { ResourceType } from "../types/communityResources";

type ResourceFilterOption = "all" | ResourceType;

// Update the interface to include the callbacks
interface MapboxOptions {
  center?: [number, number];
  zoom?: number;
  onShowCensusData?: (geoid: string) => void;
  onShowResourceData?: (resourceId: number) => void;
}

const useMapbox = (options: MapboxOptions = {}) => {
  const mapContainer = useRef<HTMLDivElement>(null!);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const resourcesDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const selectedBlocks = useStore(selectedCensusBlocks);
  const [censusLayersVisible, setCensusLayersVisible] = useState(false);
  const [resourcesLayerVisible, setResourcesLayerVisibleState] =
    useState(false);
  const [heatmapVisible, setHeatmapVisible] = useState(true);
  const [resourceFilter, setResourceFilterState] =
    useState<ResourceFilterOption>("all");
  const [businessLayerVisible, setBusinessLayerVisibleState] = useState(false);
  const [businessFilter, setBusinessFilterState] = useState<string>("all");
  const businessDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const [boundaryVisibility, setBoundaryVisibilityState] =
    useState<BoundaryVisibilityConfig>({
      county: false,
      district: false,
      neighborhood: false,
    });

  // Extract callbacks from options
  const { onShowCensusData, onShowResourceData, ...mapOptions } = options;

  const toggleCensusLayers = useCallback(() => {
    setCensusLayersVisible((prev) => !prev);
  }, []);

  const setResourcesLayerVisibility = useCallback((visible: boolean) => {
    setResourcesLayerVisibleState(visible);
  }, []);

  const applyResourceFilter = useCallback(
    (
      dataset?: GeoJSON.FeatureCollection | null,
      filterOverride?: ResourceFilterOption
    ) => {
      if (!mapInstanceRef.current) return;
      const baseData = dataset ?? resourcesDataRef.current;
      if (!baseData) return;

      const activeFilter = filterOverride ?? resourceFilter;

      const filteredFeatures =
        activeFilter === "all"
          ? baseData.features
          : baseData.features.filter((feature) => {
              const featureType = (feature.properties as {
                type?: string;
              })?.type;
              return featureType === activeFilter;
            });

      updateCommunityResourcesData(mapInstanceRef.current, {
        type: baseData.type,
        features: filteredFeatures,
      });
    },
    [resourceFilter]
  );

  const changeResourceFilter = useCallback(
    (filter: ResourceFilterOption) => {
      setResourceFilterState(filter);
      applyResourceFilter(resourcesDataRef.current, filter);
    },
    [applyResourceFilter]
  );

  const setBusinessLayerVisibility = useCallback((visible: boolean) => {
    setBusinessLayerVisibleState(visible);
  }, []);

  const applyBusinessFilter = useCallback(
    (
      dataset?: GeoJSON.FeatureCollection | null,
      filterOverride?: string
    ) => {
      if (!mapInstanceRef.current) return;
      const baseData = dataset ?? businessDataRef.current;
      if (!baseData) return;

      const activeFilter = filterOverride ?? businessFilter;

      const filteredFeatures =
        activeFilter === "all"
          ? baseData.features
          : baseData.features.filter((feature) => {
              const bt = (feature.properties as { business_type?: string })
                ?.business_type;
              return bt === activeFilter;
            });

      updateBusinessData(mapInstanceRef.current, {
        type: baseData.type,
        features: filteredFeatures,
      });
    },
    [businessFilter]
  );

  const changeBusinessFilter = useCallback(
    (filter: string) => {
      setBusinessFilterState(filter);
      applyBusinessFilter(businessDataRef.current, filter);
    },
    [applyBusinessFilter]
  );

  const toggleHeatmapLayer = useCallback(() => {
    setHeatmapVisible((prev) => !prev);
  }, []);

  const setBoundaryVisibility = useCallback(
    (visibility: BoundaryVisibilityConfig) => {
      setBoundaryVisibilityState(visibility);
    },
    []
  );

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

  // Store callbacks in refs to avoid re-initialization
  const onShowCensusDataRef = useRef(onShowCensusData);
  const onShowResourceDataRef = useRef(onShowResourceData);

  useEffect(() => {
    onShowCensusDataRef.current = onShowCensusData;
    onShowResourceDataRef.current = onShowResourceData;
  }, [onShowCensusData, onShowResourceData]);

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
            const { resourcesData, businessesData } = await setupMapSources(
              mapInstanceRef.current
            );
            resourcesDataRef.current = resourcesData;
            businessDataRef.current = businessesData;
            setupMapLayers(mapInstanceRef.current);
            applyResourceFilter(resourcesData);
            applyBusinessFilter(businessesData);

            // Pass the callbacks to setupMapEvents using refs
            // Note: onShowCensusData is now handled in Map.tsx via context menu
            setupMapEvents(
              mapInstanceRef.current,
              selectedCensusBlocks,
              onShowResourceDataRef.current
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(mapOptions)]);

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

  // Update community resources layer visibility
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      const map = mapInstanceRef.current;
      const visibility = resourcesLayerVisible ? "visible" : "none";
      map.setLayoutProperty("community-resources-circles", "visibility", visibility);
    }
  }, [resourcesLayerVisible, isLoaded]);

  // Apply resource filtering locally when filter changes
  useEffect(() => {
    if (!isLoaded) return;
    applyResourceFilter(undefined, resourceFilter);
  }, [applyResourceFilter, resourceFilter, isLoaded]);

  // Update business layer visibility
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      const map = mapInstanceRef.current;
      const visibility = businessLayerVisible ? "visible" : "none";
      map.setLayoutProperty("business-circles", "visibility", visibility);
    }
  }, [businessLayerVisible, isLoaded]);

  // Apply business type filtering when filter changes
  useEffect(() => {
    if (!isLoaded) return;
    applyBusinessFilter(undefined, businessFilter);
  }, [applyBusinessFilter, businessFilter, isLoaded]);

  // Update shooting visualization visibility (heatmap and point circles)
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      const map = mapInstanceRef.current;
      const visibility = heatmapVisible ? "visible" : "none";
      map.setLayoutProperty("shooting-heat", "visibility", visibility);
      map.setLayoutProperty("shooting-point", "visibility", visibility);
    }
  }, [heatmapVisible, isLoaded]);

  // Update boundary layer visibility
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      setBoundaryLayerVisibility(mapInstanceRef.current, boundaryVisibility);
    }
  }, [boundaryVisibility, isLoaded]);

  return {
    mapContainer,
    map: mapInstanceRef.current,
    isLoaded,
    toggleCensusLayers,
    censusLayersVisible,
    resourcesLayerVisible,
    setResourcesLayerVisibility,
    resourceFilter,
    setResourceFilter: changeResourceFilter,
    toggleHeatmapLayer,
    heatmapVisible,
    boundaryVisibility,
    setBoundaryVisibility,
    updateGeoJSON,
    updateShootingData,
    businessLayerVisible,
    setBusinessLayerVisibility,
    businessFilter,
    setBusinessFilter: changeBusinessFilter,
  };
};

export default useMapbox;
