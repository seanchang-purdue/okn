// src/config/mapbox/sources.ts
import type { SourceSpecification } from 'mapbox-gl';

const serverUrl = import.meta.env.PUBLIC_SERVER_URL || "http://localhost:8080/api";

export const endpoints = {
  shooting: `${serverUrl}/heatmap-geopoints`,
  censusBlocks: `${serverUrl}/census-block-geopoints`,
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
  },
} satisfies Record<string, SourceSpecification>;

export type SourceKeys = keyof typeof sources;
