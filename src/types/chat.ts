// types/chat.ts
import type { FilterState } from "./filters";
import type {
  InsightBlockType,
  SemanticBlockType,
  TextBlockRole,
  InsightBlockMeta,
} from "./insight";

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

export interface ArtifactMetadata {
  section_type?: "analysis";
  chart_type?: "time_series" | "bar" | "pie" | "multi_line_time_series" | string;
  source?: "auto_heuristic" | "agent";
  [key: string]: unknown;
}

export interface Artifact {
  id: string;
  type: "chart" | "markdown";
  title: string;
  content: string;
  metadata?: ArtifactMetadata;
}

export type Message = {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  task?: string | null;
  data?: unknown;
  chart?: string; // Base64-encoded PNG image as data URL
  artifacts?: Artifact[]; // Multi-artifact array (research mode)
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
  mode?: "auto" | "research";
};

export type ChatHook = {
  messages: Message[];
  streamingMessages: Map<string, Message>;
  sendMessage: (message: string) => void;
  isConnected: boolean;
  loading: boolean;
  mapLoading: boolean;
  mapStatusMessage: string;
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
  // Phase 0: Clarification
  | "needs_clarification"
  // Agent runtime lifecycle
  | "request_accepted"
  | "route_selected"
  | "plan_started"
  | "plan_ready"
  | "tool_started"
  | "tool_completed"
  | "validation_failed"
  | "synthesis_started"
  // Phase 1: Query Understanding & Planning
  | "classifying_query"
  | "planning_queries"
  // Phase 2: SQL Generation & Execution
  | "generating_sql"
  | "validating_sql"
  | "executing_query"
  | "retrying_query"
  | "searching_alternatives"
  // Phase 3: Result Processing
  | "processing_results"
  | "interpreting_data"
  | "synthesizing"
  // Phase 3b: Agent loop (Backend Phase 6)
  | "agent_thinking"
  | "agent_tool_call"
  | "agent_tool_result"
  | "agent_synthesizing"
  // Phase 4: Response Generation
  | "generating_response"
  | "streaming_response"
  // Phase 5: Visualization
  | "generating_chart"
  | "generating_map"
  // Completion
  | "complete";

/**
 * Phase-specific metadata for the fixed pipeline (non-agent path)
 */
export interface FixedPhaseInfo {
  phase: "understanding" | "planning" | "searching" | "analyzing" | "streaming" | "visualization";
  description?: string;
  queryType?: "single" | "multi";
  totalQueries?: number;
  rowCount?: number;
  chartType?: string;
  strategy?: string;
}

/**
 * Phase-specific metadata for the agent loop pipeline
 */
export interface AgentPhaseInfo {
  phase: "agent";
  step: number;
  maxSteps: number;
  stage: "agent_thinking" | "agent_tool_call" | "agent_tool_result" | "agent_synthesizing";
  tool?: string;
  args?: Record<string, unknown>;
  rowCount?: number;
  preview?: string;
}

/**
 * Phase-specific metadata — discriminated union on `phase`
 */
export type PhaseInfo = FixedPhaseInfo | AgentPhaseInfo;

/**
 * Status message payload - for real-time progress updates
 * DO NOT store these in chat history
 */
export interface StatusPayload {
  stage: StatusStage;
  message: string;
  progress?: number; // 0-100 overall progress
  attempt?: number; // Current retry attempt (1-indexed)
  maxAttempts?: number; // Maximum retry attempts
  // Enhanced fields for detailed progress
  subStep?: string; // e.g., "1 of 3"
  totalSubSteps?: number; // Total steps in current phase
  currentSubStep?: number; // Current step number (1-indexed)
  estimatedTimeMs?: number; // Estimated time remaining in ms
  phaseInfo?: PhaseInfo; // Phase-specific metadata
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
  messageId?: string; // UUID matching STREAM chunks for this response
  message?: Message | null; // null when response was streamed
  data?: GeoJSON.FeatureCollection | unknown; // GeoJSON for filter_update, formatted data for census
  chart?: string; // DEPRECATED — use artifacts instead
  artifacts?: Artifact[]; // Charts + detailed analysis as structured artifacts
  quickActions?: QuickAction[]; // Follow-up action buttons
  blocks?: ResponseBlockPayload[]; // Structured insight blocks from backend
}

export type BackendSemanticBlockType =
  | SemanticBlockType
  | "plan"
  | "finding"
  | "map_action"
  | "evidence"
  | "follow_up"
  | "failure";

export interface ResponseBlockPayload {
  id?: string;
  type: InsightBlockType | BackendSemanticBlockType;
  data: unknown;
  timestamp?: number;
  streaming?: boolean;
  query?: string;
  semanticType?: SemanticBlockType;
  role?: TextBlockRole;
  meta?: InsightBlockMeta;
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

export type AgentEventType =
  | "request.accepted"
  | "route.selected"
  | "plan.started"
  | "plan.ready"
  | "tool.started"
  | "tool.completed"
  | "validation.failed"
  | "synthesis.started"
  | "block.stream.delta"
  | "block.emitted"
  | "response.completed"
  | "response.error";

export interface AgentEventPayload {
  requestId?: string;
  type: AgentEventType;
  ts?: string;
  data?: Record<string, unknown>;
}

/**
 * Standardized WebSocket message envelope
 */
export type WSMessageType =
  | "status"
  | "response"
  | "error"
  | "stream"
  | "event";

export interface WSMessage {
  type: WSMessageType;
  payload:
    | StatusPayload
    | ResponsePayload
    | ErrorPayload
    | StreamPayload
    | AgentEventPayload;
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

export interface WSAgentEventMessage extends WSMessage {
  type: "event";
  payload: AgentEventPayload;
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
