import { endpoints } from "../../config/mapbox/sources";

export type TimeRange = "last_year" | "last_3_years" | "last_5_years" | "all";

export interface HeatmapMetadata {
  count: number;
  date_range?: { start: string; end: string };
  cities?: string[];
}

// The API returns a FeatureCollection plus optional metadata
export type HeatmapApiResponse = GeoJSON.FeatureCollection & {
  metadata?: HeatmapMetadata;
};

export interface HeatmapQuery {
  time_range?: TimeRange;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  fatal_only?: boolean;
  source_city?: string; // e.g., "chicago" | "philadelphia"
}

export const buildHeatmapUrl = (query?: HeatmapQuery): string => {
  const url = new URL(endpoints.shooting);
  if (query) {
    if (query.time_range) url.searchParams.set("time_range", query.time_range);
    if (query.start_date) url.searchParams.set("start_date", query.start_date);
    if (query.end_date) url.searchParams.set("end_date", query.end_date);
    if (typeof query.fatal_only === "boolean")
      url.searchParams.set("fatal_only", String(query.fatal_only));
    if (query.source_city)
      url.searchParams.set("source_city", query.source_city);
  }
  return url.toString();
};

export const fetchHeatmapGeoJSON = async (
  query?: HeatmapQuery
): Promise<HeatmapApiResponse> => {
  const url = buildHeatmapUrl(query);
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch heatmap data (${resp.status})`);
  }
  return (await resp.json()) as HeatmapApiResponse;
};
