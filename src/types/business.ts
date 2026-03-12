// src/types/business.ts

/**
 * Properties attached to each business GeoJSON feature
 */
export interface BusinessProperties {
  id: number;
  company: string;
  business_type: string;
  naics_code: string;
  naics_description: string;
  address: string;
  census_tract: string;
}

/**
 * A single business GeoJSON feature
 */
export interface BusinessFeature extends GeoJSON.Feature {
  geometry: GeoJSON.Point;
  properties: BusinessProperties;
}

/**
 * Response from GET /businesses/map
 */
export interface BusinessesGeoJSON extends GeoJSON.FeatureCollection {
  features: BusinessFeature[];
  metadata: {
    count: number;
  };
}

/**
 * A single entry from GET /businesses/types
 */
export interface BusinessTypeInfo {
  business_type: string;
  count: number;
}

/**
 * Response from GET /businesses/types
 */
export interface BusinessTypesResponse {
  types: BusinessTypeInfo[];
}

/**
 * Query parameters for GET /businesses/map
 */
export interface BusinessMapFilters {
  city?: string;
  business_type?: string[];
  naics_code?: string[];
}
