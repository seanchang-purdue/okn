// types/chat.ts
import type { FilterState } from "./filters";

export const MAX_CHARACTERS = 1000;
export const MAX_QUESTIONS = 10; // Maximum number of questions per session

export type MessageType = "user" | "system" | "assistant";

/**
 * Quick action button structure
 */
export interface QuickAction {
  label: string; // Short descriptive text (2-4 words)
  query: string; // Complete query string to send when clicked
  icon: string; // Single emoji character
}

export type Message = {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  task?: string | null;
  data?: unknown;
  chart?: string; // Base64-encoded PNG image as data URL
  quickActions?: QuickAction[]; // Quick action buttons
  isComplete?: boolean; // Streaming completion flag
};

export type WebSocketPayload = {
  type: "chat" | "filter_update" | "census_update";
  content?: string;
  isUser: boolean;
  filters?: FilterState;
  censusTracts?: string[];
  updateMap?: boolean;
  requiresPreviousContext?: boolean;
};

export type ChatHook = {
  messages: Message[];
  streamingMessages: Map<string, Message>;
  sendMessage: (message: string) => void;
  isConnected: boolean;
  loading: boolean;
  mapLoading: boolean;
  error: string;
  remainingQuestions: number;
  resetChat: () => void;
  updateFilters: (filters: FilterState) => void;
  updateCensusTracts: (tracts: string[]) => void;
  generateSummary: () => void;
  currentStatus: StatusPayload | null;
};

// ============================================================================
// NEW STANDARDIZED MESSAGE STRUCTURE
// ============================================================================

/**
 * Status stage types for real-time progress updates
 */
export type StatusStage =
  | "generating_sql"
  | "executing_query"
  | "retrying_query"
  | "searching_alternatives"
  | "interpreting_data"
  | "generating_response"
  | "complete";

/**
 * Status message payload - for real-time progress updates
 * DO NOT store these in chat history
 */
export interface StatusPayload {
  stage: StatusStage;
  message: string;
  progress?: number; // 0-100
  attempt?: number; // Current attempt
  maxAttempts?: number; // Max attempts
}

/**
 * Task types for response messages
 */
export type TaskType = "chat" | "filter_update" | "census_update";

/**
 * Stream message payload - for real-time text streaming
 */
export interface StreamPayload {
  task: TaskType;
  chunk: string; // Text chunk (may be single character or multiple words)
  messageId: string; // UUID identifying this message
  isComplete: boolean; // false for chunks, true for final empty chunk
  sessionId: string;
}

/**
 * Response message payload - for data responses
 */
export interface ResponsePayload {
  task: TaskType;
  sessionId: string;
  message?: Message; // For chat task only
  data?: GeoJSON.FeatureCollection | unknown; // GeoJSON for filter_update, formatted data for census
  chart?: string; // Base64-encoded PNG image as data URL
  quickActions?: QuickAction[]; // Array of quick action objects
}

/**
 * Error codes for standardized error handling
 */
export type ErrorCode =
  | "SQL_EXECUTION_FAILED"
  | "INVALID_MESSAGE"
  | "MESSAGE_TOO_LONG"
  | "MAX_QUESTIONS_EXCEEDED"
  | "PROCESSING_ERROR"
  | "INVALID_JSON"
  | "UNKNOWN_ERROR"
  | "AI_COMPLETION_FAILED"
  | "FILTER_UPDATE_FAILED"
  | "CENSUS_UPDATE_FAILED";

/**
 * Error message payload - for standardized errors
 */
export interface ErrorPayload {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

/**
 * Message metadata
 */
export interface MessageMetadata {
  timestamp: number;
  sessionId?: string;
}

/**
 * Standardized WebSocket message envelope
 */
export type WSMessageType = "status" | "response" | "error" | "stream";

export interface WSMessage {
  type: WSMessageType;
  payload: StatusPayload | ResponsePayload | ErrorPayload | StreamPayload;
  metadata?: MessageMetadata;
}

/**
 * Type guards for message discrimination
 */
export interface WSStatusMessage extends WSMessage {
  type: "status";
  payload: StatusPayload;
}

export interface WSStreamMessage extends WSMessage {
  type: "stream";
  payload: StreamPayload;
}

export interface WSResponseMessage extends WSMessage {
  type: "response";
  payload: ResponsePayload;
}

export interface WSErrorMessage extends WSMessage {
  type: "error";
  payload: ErrorPayload;
}

// ============================================================================
// LEGACY TYPES (for backward compatibility during migration)
// ============================================================================

interface BaseResponse {
  type: MessageType;
  task?: string;
  data?: GeoJSON.FeatureCollection;
}

export interface GeoJSONResponse extends BaseResponse {
  type: "assistant";
  task: "filter_update";
  data: GeoJSON.FeatureCollection;
}

export interface MessageResponse extends BaseResponse {
  type: "assistant";
  sessionId: string;
  messages: Message[];
}

export type WebSocketResponse = GeoJSONResponse | MessageResponse;
