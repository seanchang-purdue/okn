// services/communityResources.ts
import type {
  ResourcesGeoJSON,
  ResourceListResponse,
  ResourceDetails,
  ResourceFilters,
} from "../types/communityResources";

const API_BASE =
  import.meta.env.PUBLIC_SERVER_URL || "http://localhost:8000/api/v1";

/**
 * Fetch paginated list of community resources
 */
export async function getCommunityResourcesList(
  filters?: ResourceFilters
): Promise<ResourceListResponse> {
  const params = new URLSearchParams();

  // Default to Philadelphia if no city specified
  if (!filters?.source_city) {
    params.append("source_city", "philadelphia");
  } else {
    params.append("source_city", filters.source_city);
  }

  // Add optional filters
  if (filters?.resource_type) {
    params.append("resource_type", filters.resource_type);
  }

  if (filters?.availability) {
    params.append("availability", filters.availability);
  }

  if (filters?.zipcode) {
    params.append("zipcode", filters.zipcode);
  }

  if (filters?.search) {
    params.append("search", filters.search);
  }

  if (filters?.limit) {
    params.append("limit", filters.limit.toString());
  }

  if (filters?.offset) {
    params.append("offset", filters.offset.toString());
  }

  const url = `${API_BASE}/resources?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch community resources list: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Fetch community resources as GeoJSON for map display.
 * Converts the list response to GeoJSON FeatureCollection.
 */
export async function getCommunityResourcesGeoJSON(
  filters?: ResourceFilters
): Promise<ResourcesGeoJSON> {
  const effectiveFilters: ResourceFilters = {
    ...filters,
    limit: filters?.limit ?? 500,
  };

  if (!effectiveFilters.source_city) {
    effectiveFilters.source_city = "philadelphia";
  }

  if (effectiveFilters.availability === undefined) {
    effectiveFilters.availability = "available";
  }

  const listResponse = await getCommunityResourcesList(effectiveFilters);

  const features = listResponse.resources
    .filter(
      (resource) =>
        typeof resource.longitude === "number" &&
        typeof resource.latitude === "number"
    )
    .map((resource) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [resource.longitude, resource.latitude],
      },
      properties: {
        id: resource.id,
        name: resource.service_name,
        type: resource.resource_type,
        category:
          resource.service_category ??
          resource.main_services ??
          "Community Resource",
        address: resource.location_address,
        phone: resource.phone_number ?? null,
        availability: resource.availability ?? "unknown",
        is24hour: resource.is_24hour,
        cost: resource.cost ?? null,
        rating: resource.google_rating ?? null,
        zipcode: resource.zipcode ?? null,
      },
    })) as ResourcesGeoJSON["features"];

  const metadata: ResourcesGeoJSON["metadata"] = {
    count: features.length,
    city: effectiveFilters.source_city ?? "unknown",
  };

  if (effectiveFilters.resource_type) {
    metadata.resource_type = effectiveFilters.resource_type;
  }
  if (effectiveFilters.availability !== undefined) {
    metadata.availability = (
      effectiveFilters.availability ?? "unknown"
    ) as ResourcesGeoJSON["metadata"]["availability"];
  }

  return {
    type: "FeatureCollection",
    features,
    metadata,
  };
}

/**
 * Fetch detailed information for a specific resource
 */
export async function getResourceDetails(
  resourceId: number
): Promise<ResourceDetails> {
  const url = `${API_BASE}/resources/${resourceId}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch resource details: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Helper function to fetch resources by proximity to a location
 * (filters client-side for now, could be a backend endpoint later)
 */
export async function getResourcesByProximity(
  latitude: number,
  longitude: number,
  radiusMiles: number = 1,
  filters?: Omit<ResourceFilters, "limit">
): Promise<ResourcesGeoJSON> {
  // Fetch all resources with the given filters
  const data = await getCommunityResourcesGeoJSON({
    ...filters,
    limit: 1000, // Get more for proximity filtering
  });

  // Calculate radius in degrees (rough approximation: 1 degree ≈ 69 miles)
  const radiusDegrees = radiusMiles / 69;

  // Filter features by proximity
  const nearbyFeatures = data.features.filter((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const distance = Math.sqrt(
      Math.pow(lng - longitude, 2) + Math.pow(lat - latitude, 2)
    );
    return distance <= radiusDegrees;
  });

  return {
    type: "FeatureCollection",
    features: nearbyFeatures,
    metadata: {
      ...data.metadata,
      count: nearbyFeatures.length,
    },
  };
}
