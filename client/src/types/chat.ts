// types/chat.ts
import type { FilterState } from "./filters";

export const MAX_CHARACTERS = 1000;
export const MAX_QUESTIONS = 10; // Maximum number of questions per session

export type MessageType = "user" | "system" | "assistant";

export type Message = {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  task?: string;
  data?: any;
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
};

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
