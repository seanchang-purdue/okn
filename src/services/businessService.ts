// src/services/businessService.ts
import type {
  BusinessesGeoJSON,
  BusinessTypesResponse,
  BusinessMapFilters,
} from "../types/business";
import { apiUrl } from "../config/api";

const API_BASE = apiUrl("").replace(/\/$/, "");

/**
 * Fetch business locations as GeoJSON for map display.
 */
export async function getBusinessesGeoJSON(
  filters?: BusinessMapFilters
): Promise<BusinessesGeoJSON> {
  const params = new URLSearchParams();

  if (filters?.city) {
    params.append("city", filters.city);
  }

  if (filters?.business_type) {
    for (const bt of filters.business_type) {
      params.append("business_type", bt);
    }
  }

  if (filters?.naics_code) {
    for (const nc of filters.naics_code) {
      params.append("naics_code", nc);
    }
  }

  const qs = params.toString();
  const url = `${API_BASE}/businesses/map${qs ? `?${qs}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch businesses GeoJSON: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch distinct business types with counts (for filter dropdown).
 */
export async function getBusinessTypes(
  city?: string
): Promise<BusinessTypesResponse> {
  const params = new URLSearchParams();
  if (city) {
    params.append("city", city);
  }

  const qs = params.toString();
  const url = `${API_BASE}/businesses/types${qs ? `?${qs}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch business types: ${response.statusText}`);
  }

  return response.json();
}
