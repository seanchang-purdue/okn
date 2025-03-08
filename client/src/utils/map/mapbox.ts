// src/utils/mapbox.ts
import mapboxgl from "mapbox-gl";
import type { GeoJSONFeature } from "mapbox-gl";
import { sources, endpoints } from "../../config/mapbox/sources";
import { layers } from "../../config/mapbox/layers";
import type { WritableAtom } from "nanostores";

interface CensusBlockProperties {
  tractId: string;
}

interface IncidentProperties {
  datetime: string;
  race: string;
  sex: string;
  age: string;
  fatal: string;
  census_tract: string;
  len: number;
}

export const initializeMap = (container: HTMLDivElement, options: object) => {
  if (!mapboxgl.accessToken) {
    mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;
  }

  return new mapboxgl.Map({
    container,
    ...options,
  });
};

export const fetchGeoJSON = async (
  url: string
): Promise<GeoJSON.FeatureCollection> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON from ${url}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching GeoJSON from ${url}:`, error);
    // Return empty feature collection as fallback
    return { type: "FeatureCollection", features: [] };
  }
};

export const setupMapSources = async (map: mapboxgl.Map) => {
  try {
    // Add sources with empty data first
    Object.entries(sources).forEach(([id, source]) => {
      if (!map.getSource(id)) {
        map.addSource(id, source);
      }
    });

    // Fetch data
    const [shootingData, censusData] = await Promise.all([
      fetchGeoJSON(endpoints.shooting),
      fetchGeoJSON(endpoints.censusBlocks),
    ]);

    // Update sources with fetched data
    (map.getSource("shooting") as mapboxgl.GeoJSONSource)?.setData(
      shootingData
    );
    (map.getSource("censusBlocks") as mapboxgl.GeoJSONSource)?.setData(
      censusData
    );

    return { shootingData, censusData };
  } catch (error) {
    console.error("Error setting up map sources:", error);
    throw error;
  }
};

type LayerKey = keyof typeof layers;

export const setupMapLayers = (map: mapboxgl.Map) => {
  try {
    // Specify the layer order with correct typing
    const layerOrder: LayerKey[] = [
      "heatmap",
      "points",
      "censusOutline",
      "censusFill",
    ];

    layerOrder.forEach((layerId) => {
      const layer = layers[layerId];
      if (!map.getLayer(layer.id)) {
        map.addLayer(layer);
      }
    });
  } catch (error) {
    console.error("Error setting up map layers:", error);
    throw error;
  }
};

export const setupMapEvents = (
  map: mapboxgl.Map,
  censusBlockStore: WritableAtom<string[]>,
  onShowCensusData?: (tractId: string) => void
) => {
  // Shooting point click event with visibility check
  map.on("click", "shooting-point", (e) => {
    // Check if census layers are visible
    const censusLayerVisible =
      map.getLayoutProperty("census-blocks-fill", "visibility") === "visible";

    // If census layers are visible, don't process shooting point clicks
    if (censusLayerVisible) return;

    if (!e.features?.length) return;

    const feature = e.features[0] as GeoJSONFeature;
    const coordinates = (feature.geometry as GeoJSON.Point).coordinates;

    if (!coordinates) return;

    new mapboxgl.Popup({ className: "shooting-popup text-black" })
      .setLngLat([coordinates[0], coordinates[1]])
      .setHTML(createPopupContent(feature.properties as IncidentProperties))
      .addTo(map);
  });

  // Census block click event
  map.on("click", "census-blocks-fill", (e) => {
    if (!e.features?.length) return;
    const blockId = e.features[0].properties?.id;
    if (blockId) {
      const currentBlocks = censusBlockStore.get();
      censusBlockStore.set(
        currentBlocks.includes(blockId)
          ? currentBlocks.filter((id) => id !== blockId)
          : [...currentBlocks, blockId]
      );
    }
  });

  map.getCanvas().addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  map.on("contextmenu", "census-blocks-fill", (e) => {
    e.preventDefault();

    if (!e.features?.length) return;

    const tractId = e.features[0].properties?.id;
    if (tractId && onShowCensusData) {
      onShowCensusData(tractId);
    }
  });

  // In setupMapEvents function
  let hoveredStateId: string | null = null;

  // Create a popup but don't add it to the map yet
  const censusPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: "census-popup text-black",
    // Add these options for better performance
    anchor: "bottom",
    offset: [0, -5],
  });

  // Use mousemove instead of mouseenter for smoother tracking
  map.on("mousemove", "census-blocks-fill", (e) => {
    map.getCanvas().style.cursor = "pointer";

    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const tractId = feature.properties?.id || "Unknown";

      // Update the hover state
      if (hoveredStateId !== tractId) {
        // If we're hovering a new feature, update the hover state
        hoveredStateId = tractId;

        // Apply a filter or style change to show hover state
        map.setPaintProperty("census-blocks-fill", "fill-color", [
          "case",
          ["in", ["get", "id"], ["literal", censusBlockStore.get()]],
          "rgba(18, 120, 240, 0.5)", // Selected color (darker)
          ["==", ["get", "id"], tractId],
          "rgba(18, 120, 240, 0.2)", // Hover color (lighter)
          "rgba(0, 0, 0, 0)", // Default transparent
        ]);
      }

      // Create popup content
      const popupContent = createCensusPopupContent({
        tractId,
      });

      // Set popup content and position at mouse pointer
      censusPopup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
    }
  });

  map.on("mouseleave", "census-blocks-fill", () => {
    map.getCanvas().style.cursor = "";

    // Reset hover state
    if (hoveredStateId) {
      hoveredStateId = null;

      // Reset the fill color to only show selected blocks
      map.setPaintProperty("census-blocks-fill", "fill-color", [
        "case",
        ["in", ["get", "id"], ["literal", censusBlockStore.get()]],
        "rgba(18, 120, 240, 0.5)", // Selected color
        "rgba(0, 0, 0, 0)", // Default transparent
      ]);
    }

    // Remove the popup
    censusPopup.remove();
  });
};

export const updateShootingData = (
  map: mapboxgl.Map,
  data: GeoJSON.FeatureCollection
) => {
  const source = map.getSource("shooting") as mapboxgl.GeoJSONSource;
  if (source) {
    source.setData(data);
  }
};

const createPopupContent = (properties: IncidentProperties): string => {
  const datetime = properties.datetime ? new Date(properties.datetime) : null;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
                background: white;
                border-radius: 6px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.15);
                overflow: hidden;
                width: 240px;
                padding: 0;
                margin: 0;">
      <div style="background: #1e3a8a;
                  color: white;
                  padding: 10px 16px;
                  font-size: 14px;
                  font-weight: 600;
                  border-bottom: 1px solid rgba(0,0,0,0.1);">
        Shooting Incident Details
      </div>
      <div style="padding: 12px 16px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 6px 0; color: #666; width: 35%;">Date</td>
            <td style="padding: 6px 0; font-weight: 500;">${datetime?.toLocaleDateString() || "Unknown"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 6px 0; color: #666;">Time</td>
            <td style="padding: 6px 0; font-weight: 500;">${
              datetime?.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }) || "Unknown"
            }</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 6px 0; color: #666;">Race</td>
            <td style="padding: 6px 0; font-weight: 500;">${properties.race || "Unknown"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 6px 0; color: #666;">Sex</td>
            <td style="padding: 6px 0; font-weight: 500;">${properties.sex || "Unknown"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 6px 0; color: #666;">Age</td>
            <td style="padding: 6px 0; font-weight: 500;">${properties.age ? parseInt(properties.age) : "Unknown"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 6px 0; color: #666;">Fatal</td>
            <td style="padding: 6px 0; font-weight: 500; ${properties.fatal === "1.0" ? "color: #dc2626;" : "color: #059669;"}">${properties.fatal === "1.0" ? "Yes" : "No"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Census Tract</td>
            <td style="padding: 6px 0; font-weight: 500;">${properties.census_tract || "Unknown"}</td>
          </tr>
        </table>
      </div>
    </div>
  `;
};

const createCensusPopupContent = (
  properties: CensusBlockProperties
): string => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.12);
                overflow: hidden;
                width: 240px;
                padding: 0;
                margin: 0;">
      <div style="background: #2563eb;
                  color: white;
                  padding: 12px 16px;
                  font-size: 14px;
                  font-weight: 600;
                  border-bottom: 1px solid rgba(0,0,0,0.1);">
        Census Tract Information
      </div>
      <div style="padding: 16px;">
        <div style="font-weight: 500; font-size: 15px; margin-bottom: 12px;">
          Tract ID: ${properties.tractId}
        </div>
        <div style="margin-top: 16px; border-top: 1px solid #eaeaea; padding-top: 16px;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 24px; color: #2563eb; margin-right: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M17.6 4.2L16.5 3.1C16.1 2.7 15.5 2.7 15.1 3.1L7.4 10.9L4.9 8.4C4.5 8 3.9 8 3.5 8.4L2.4 9.5C2 9.9 2 10.5 2.4 10.9L6.9 15.4C7.3 15.8 7.9 15.8 8.3 15.4L17.6 6.1C18.1 5.7 18.1 4.6 17.6 4.2Z"/>
              </svg>
            </div>
            <div style="font-size: 13px; color: #444;">
              Click to select/deselect this tract
            </div>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 24px; color: #2563eb; margin-right: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z"/>
              </svg>
            </div>
            <div style="font-size: 13px; color: #444;">
              Right-click to view census data
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
