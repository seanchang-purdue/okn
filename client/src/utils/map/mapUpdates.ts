// src/utils/map/mapUpdates.ts
import type { Map as MapboxMap } from "mapbox-gl";

export const updateCensusSelection = (
  map: MapboxMap,
  selectedBlocks: string[],
  hoveredBlockId: string | null = null
) => {
  map.setPaintProperty("census-blocks-fill", "fill-color", [
    "case",
    ["in", ["get", "geoid"], ["literal", selectedBlocks]],
    "rgba(18, 120, 240, 0.5)", // Selected color (darker)
    hoveredBlockId ? ["==", ["get", "geoid"], hoveredBlockId] : false,
    "rgba(18, 120, 240, 0.2)", // Hover color (lighter)
    "rgba(0, 0, 0, 0)", // Default transparent
  ]);
};

export const updateCensusVisibility = (map: MapboxMap, visible: boolean) => {
  const visibility = visible ? "visible" : "none";
  map.setLayoutProperty("census-block-outline", "visibility", visibility);
  map.setLayoutProperty("census-blocks-fill", "visibility", visibility);
};
