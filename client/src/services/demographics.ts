// src/services/api.ts
import type { ApiResponse } from "../types/response";
import type {
  CensusTractDemographic,
  CensusTractListItem,
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
  geoid: string
): Promise<CensusTractDemographic> => {
  const response = await fetch(`${API_BASE_URL}/census-tract/${geoid}`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<CensusTractDemographic> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch demographic data for tract ${geoid}`
    );
  }

  return result.data;
};

/**
 * Fetch summary data for a specific census tract
 */
export const getCensusTractSummary = async (
  geoid: string
): Promise<CensusTractDemographic> => {
  const response = await fetch(`${API_BASE_URL}/census-tract/${geoid}/summary`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<CensusTractDemographic> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch summary data for tract ${geoid}`
    );
  }

  return result.data;
};

/**
 * Fetch race data for a specific census tract
 */
export const getCensusTractRace = async (geoid: string): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}/census-tract/${geoid}/race`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<unknown> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch race data for tract ${geoid}`
    );
  }

  return result.data;
};

/**
 * Fetch race summary data for a specific census tract
 */
export const getCensusTractRaceSummary = async (
  geoid: string
): Promise<unknown> => {
  const response = await fetch(
    `${API_BASE_URL}/census-tract/${geoid}/race/summary`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<unknown> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch race summary data for tract ${geoid}`
    );
  }

  return result.data;
};

/**
 * Fetch age data for a specific census tract
 */
export const getCensusTractAge = async (geoid: string): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}/census-tract/${geoid}/age`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<unknown> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch age data for tract ${geoid}`
    );
  }

  return result.data;
};

/**
 * Fetch age summary data for a specific census tract
 */
export const getCensusTractAgeSummary = async (
  geoid: string
): Promise<unknown> => {
  const response = await fetch(
    `${API_BASE_URL}/census-tract/${geoid}/age/summary`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<unknown> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || `Failed to fetch age summary data for tract ${geoid}`
    );
  }

  return result.data;
};

/**
 * Fetch age data by gender for a specific census tract
 */
export const getCensusTractAgeByGender = async (
  geoid: string,
  gender: string
): Promise<unknown> => {
  const response = await fetch(
    `${API_BASE_URL}/census-tract/${geoid}/age/${gender}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<unknown> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error ||
        `Failed to fetch age data for gender ${gender} in tract ${geoid}`
    );
  }

  return result.data;
};

/**
 * Fetch census tracts with incidents
 */
export const getCensusTractsWithIncidents = async (): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}/census-tracts/with-incidents`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<unknown> = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || "Failed to fetch census tracts with incidents"
    );
  }

  return result.data;
};
