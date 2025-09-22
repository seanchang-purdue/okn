// src/types/response.ts

/**
 * Base API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error: string | null;
  timestamp: string;
}

/**
 * Helper type for extracting the data type from an API response
 */
export type ApiResponseData<T> = T extends ApiResponse<infer U> ? U : never;
