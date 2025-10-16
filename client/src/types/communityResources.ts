// types/communityResources.ts

/**
 * Resource type enum
 */
export type ResourceType = "food" | "shelter" | "mental_health";

/**
 * Availability status
 */
export type AvailabilityStatus = "available" | "full" | "closed" | "unknown";

/**
 * Community resource GeoJSON properties (from map endpoint)
 */
export interface ResourceProperties {
  id: number;
  name: string;
  type: ResourceType;
  category: string;
  address: string;
  phone: string | null;
  availability: AvailabilityStatus;
  is24hour: boolean;
  cost: string | null;
  rating: number | null;
  zipcode: string | null;
}

/**
 * Community resource GeoJSON feature
 */
export interface ResourceFeature extends GeoJSON.Feature {
  geometry: GeoJSON.Point;
  properties: ResourceProperties;
}

/**
 * Community resources GeoJSON response from /v1/resources/map
 */
export interface ResourcesGeoJSON extends GeoJSON.FeatureCollection {
  features: ResourceFeature[];
  metadata: {
    count: number;
    city: string;
    resource_type?: ResourceType;
    availability?: AvailabilityStatus;
  };
}

/**
 * Full resource details (from /v1/resources/{id})
 */
export interface ResourceDetails {
  id: number;
  service_name: string;
  service_url?: string;
  resource_type: ResourceType;
  source_city: string;
  main_services?: string;
  other_services?: string;
  serving?: string;
  phone_number?: string;
  website?: string;
  facebook_url?: string;
  twitter_url?: string;
  location_address: string;
  location_url_map?: string;
  latitude: number;
  longitude: number;
  zipcode?: string;
  coverage?: string;
  eligibility?: string;
  availability?: AvailabilityStatus;
  description?: string;
  languages?: string;
  cost?: string;
  is_24hour: boolean;
  monday_hours?: string;
  tuesday_hours?: string;
  wednesday_hours?: string;
  thursday_hours?: string;
  friday_hours?: string;
  saturday_hours?: string;
  sunday_hours?: string;
  has_google_review?: boolean;
  google_rating?: number;
  service_category?: string;
}

/**
 * Resource list item (from /v1/resources)
 */
export interface ResourceListItem {
  id: number;
  service_name: string;
  resource_type: ResourceType;
  location_address: string;
  phone_number?: string;
  website?: string;
  latitude: number;
  longitude: number;
  zipcode?: string;
  availability?: AvailabilityStatus;
  cost?: string;
  is_24hour: boolean;
  google_rating?: number;
  service_category?: string;
  main_services?: string;
  description?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  total: number;
  limit: number;
  offset: number;
  pages: number;
}

/**
 * Resource list response (from /v1/resources)
 */
export interface ResourceListResponse {
  resources: ResourceListItem[];
  pagination: PaginationMetadata;
}

/**
 * Resource filter parameters
 */
export interface ResourceFilters {
  source_city?: string;
  resource_type?: ResourceType;
  availability?: AvailabilityStatus | null;
  zipcode?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * UI-friendly resource type labels
 */
export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  food: "Food",
  shelter: "Shelter",
  mental_health: "Mental Health",
};

/**
 * UI-friendly resource type colors (for map markers and badges)
 */
export const RESOURCE_TYPE_COLORS: Record<ResourceType, string> = {
  food: "#22c55e", // Green
  shelter: "#3b82f6", // Blue
  mental_health: "#a855f7", // Purple
};

/**
 * Icon mapping for resource types (emoji for now, can be replaced with image URLs)
 */
export const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  food: "🍽️",
  shelter: "🏠",
  mental_health: "🧠",
};
