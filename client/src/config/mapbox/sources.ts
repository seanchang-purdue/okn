// src/config/mapbox/sources.ts
import type { SourceSpecification } from "mapbox-gl";

// Unified API base (all endpoints are under /api/v1)
const API_BASE =
  import.meta.env.PUBLIC_SERVER_URL || "http://localhost:8000/api/v1";

export const endpoints = {
  // Shooting incidents heatmap points (time-range capable)
  shooting: `${API_BASE}/heatmap-geopoints`,
  // Census blocks (static-ish)
  censusBlocks: `${API_BASE}/census-block-geopoints`,
} as const;

export const sources = {
  shooting: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  },
  censusBlocks: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
    promoteId: "id",
  },
} satisfies Record<string, SourceSpecification>;

export type SourceKeys = keyof typeof sources;
