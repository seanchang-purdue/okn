// src/config/mapbox/sources.ts
import type { SourceSpecification } from "mapbox-gl";
import { apiUrl } from "../api";

export const endpoints = {
  // Shooting incidents heatmap points (time-range capable)
  shooting: apiUrl("/heatmap-geopoints"),
  // Census blocks (static-ish)
  censusBlocks: apiUrl("/census-block-geopoints"),
  // Community resources (food, shelter, mental health)
  communityResources: apiUrl("/resources/map"),
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
  communityResources: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
    promoteId: "id",
  },
} satisfies Record<string, SourceSpecification>;

export type SourceKeys = keyof typeof sources;
