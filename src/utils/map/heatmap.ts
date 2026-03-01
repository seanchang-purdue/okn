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
  source_city?: string; // e.g., "philadelphia" | "chicago" | "nyc" | "cincinnati"
}

export interface HeatmapFetchOptions {
  forceRefresh?: boolean;
}

const heatmapCache = new Map<string, HeatmapApiResponse>();
const inFlightRequests = new Map<string, Promise<HeatmapApiResponse>>();

export const buildHeatmapUrl = (query?: HeatmapQuery): string => {
  const params = new URLSearchParams();
  if (query) {
    if (query.time_range) params.set("time_range", query.time_range);
    if (query.start_date) params.set("start_date", query.start_date);
    if (query.end_date) params.set("end_date", query.end_date);
    if (typeof query.fatal_only === "boolean") {
      params.set("fatal_only", String(query.fatal_only));
    }
    if (query.source_city) params.set("source_city", query.source_city);
  }
  const queryString = params.toString();
  return queryString ? `${endpoints.shooting}?${queryString}` : endpoints.shooting;
};

export const fetchHeatmapGeoJSON = async (
  query?: HeatmapQuery,
  options?: HeatmapFetchOptions
): Promise<HeatmapApiResponse> => {
  const url = buildHeatmapUrl(query);
  const shouldBypassCache = options?.forceRefresh === true;

  if (!shouldBypassCache) {
    const cached = heatmapCache.get(url);
    if (cached) {
      return cached;
    }

    const inFlight = inFlightRequests.get(url);
    if (inFlight) {
      return inFlight;
    }
  }

  const fetchPromise = (async () => {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch heatmap data (${resp.status})`);
    }
    const data = (await resp.json()) as HeatmapApiResponse;
    heatmapCache.set(url, data);
    return data;
  })();

  if (!shouldBypassCache) {
    inFlightRequests.set(url, fetchPromise);
  }

  try {
    return await fetchPromise;
  } finally {
    if (!shouldBypassCache) {
      inFlightRequests.delete(url);
    }
  }
};

export const clearHeatmapCache = (query?: HeatmapQuery) => {
  if (query) {
    const url = buildHeatmapUrl(query);
    heatmapCache.delete(url);
    inFlightRequests.delete(url);
  } else {
    heatmapCache.clear();
    inFlightRequests.clear();
  }
};
