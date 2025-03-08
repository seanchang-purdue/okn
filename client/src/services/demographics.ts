// src/services/api.ts
import type { ApiResponse } from "../types/response";
import type {
  CensusTractDemographic,
  CensusTractListItem,
  CensusTractVisualization,
  CensusTractComparison,
} from "../types/demographic";

const serverUrl =
  import.meta.env.PUBLIC_SERVER_URL || "http://localhost:8080/api";
const API_BASE_URL = `${serverUrl}`;

/**
 * Fetch a list of all census tracts
 */
export const getCensusTracts = async (
  limit: number = 100,
  offset: number = 0
): Promise<CensusTractListItem[]> => {
  const response = await fetch(
    `${API_BASE_URL}/census-tracts?limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<CensusTractListItem[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch census tracts");
  }

  return result.data;
};

/**
 * Fetch detailed demographic data for a specific census tract
 */
export const getCensusTractDemographic = async (
  tractId: number
): Promise<CensusTractDemographic> => {
  const response = await fetch(`${API_BASE_URL}/census-tract/${tractId}`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<CensusTractDemographic> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch demographic data for tract ${tractId}`
    );
  }

  return result.data;
};

/**
 * Fetch summary data for a specific census tract
 */
export const getCensusTractSummary = async (tractId: number): Promise<any> => {
  const response = await fetch(
    `${API_BASE_URL}/census-tract/${tractId}/summary`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<any> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch summary data for tract ${tractId}`
    );
  }

  return result.data;
};

/**
 * Fetch race data for a specific census tract
 */
export const getCensusTractRace = async (tractId: number): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/census-tract/${tractId}/race`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<any> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch race data for tract ${tractId}`
    );
  }

  return result.data;
};

/**
 * Fetch race summary data for a specific census tract
 */
export const getCensusTractRaceSummary = async (
  tractId: number
): Promise<any> => {
  const response = await fetch(
    `${API_BASE_URL}/census-tract/${tractId}/race/summary`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<any> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch race summary data for tract ${tractId}`
    );
  }

  return result.data;
};

/**
 * Fetch age data for a specific census tract
 */
export const getCensusTractAge = async (tractId: number): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/census-tract/${tractId}/age`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<any> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch age data for tract ${tractId}`
    );
  }

  return result.data;
};

/**
 * Fetch age summary data for a specific census tract
 */
export const getCensusTractAgeSummary = async (
  tractId: number
): Promise<any> => {
  const response = await fetch(
    `${API_BASE_URL}/census-tract/${tractId}/age/summary`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<any> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch age summary data for tract ${tractId}`
    );
  }

  return result.data;
};

/**
 * Fetch age data by gender for a specific census tract
 */
export const getCensusTractAgeByGender = async (
  tractId: number,
  gender: string
): Promise<any> => {
  const response = await fetch(
    `${API_BASE_URL}/census-tract/${tractId}/age/${gender}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<any> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error ||
        `Failed to fetch age data for gender ${gender} in tract ${tractId}`
    );
  }

  return result.data;
};

/**
 * Fetch census tracts with incidents
 */
export const getCensusTractsWithIncidents = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/census-tracts/with-incidents`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<any> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || "Failed to fetch census tracts with incidents"
    );
  }

  return result.data;
};

// Keeping these for backward compatibility, but they should be updated or deprecated
export const getCensusTractVisualization = async (
  tractId: number
): Promise<CensusTractVisualization> => {
  // This function should be updated to use the new endpoints
  // For now, just return the summary data
  return getCensusTractSummary(tractId) as Promise<CensusTractVisualization>;
};

export const compareCensusTracts = async (
  tractIds: number[]
): Promise<CensusTractComparison> => {
  // This function needs to be reimplemented with the new API
  // For now, throw an error
  throw new Error(
    "This function has not been implemented with the new API endpoints"
  );
};
