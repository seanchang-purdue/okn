// src/stores/websocketStore.ts
import { atom } from "nanostores";
import { WebSocketManager } from "../utils/websocket";
import {
  MAX_QUESTIONS,
  type Message,
  type StatusPayload,
  type ErrorCode,
} from "../types/chat";
import type { FilterState } from "../types/filters";
import { validateMessage, createUserMessage } from "../utils/chat";
import { selectedCensusBlocks } from "./censusStore";
import type { ModelType } from "../config/ws";
import { MODEL_CONFIGS } from "../config/ws";

export const wsState = atom({
  isConnected: false,
  error: "",
  errorCode: "" as ErrorCode | "",
  retryable: false,
  messages: [] as Message[],
  geoJSONData: null as GeoJSON.FeatureCollection | null,
  loading: false,
  mapLoading: false,
  remainingQuestions: MAX_QUESTIONS,
  currentFilters: {} as FilterState,
  currentEndpoint: "CHAT" as ModelType,
  updateMap: true,
  currentStatus: null as StatusPayload | null,
});

let wsManager: WebSocketManager | null = null;

const createWebSocketManager = (endpoint: ModelType) => {
  // Disconnect existing connection if any
  if (wsManager) {
    wsManager.disconnect();
  }

  // Create new WebSocket manager with selected endpoint
  wsManager = new WebSocketManager(
    `${import.meta.env.PUBLIC_CHATBOT_URL}${MODEL_CONFIGS[endpoint]}`,
    (message: Message) => {
      const currentState = wsState.get();
      console.log("Message received", message);
      wsState.set({
        ...currentState,
        messages: [...currentState.messages, message],
        loading: false,
      });
    },
    (status: boolean) => {
      const currentState = wsState.get();
      wsState.set({ ...currentState, isConnected: status });
    },
    (error: string, code?: string, retryable?: boolean) => {
      const currentState = wsState.get();
      wsState.set({
        ...currentState,
        error,
        errorCode: (code as ErrorCode) || "",
        retryable: retryable || false,
        loading: false,
        mapLoading: false,
        currentStatus: null,
      });
    },
    (data: GeoJSON.FeatureCollection) => {
      const currentState = wsState.get();
      wsState.set({ ...currentState, geoJSONData: data, mapLoading: false });
    },
    (status: StatusPayload) => {
      const currentState = wsState.get();
      wsState.set({
        ...currentState,
        currentStatus: status,
        // Clear status when complete
        ...(status.stage === "complete" && {
          currentStatus: null,
          loading: false,
          mapLoading: false,
        }),
      });
    }
  );

  wsManager.connect();
  return wsManager;
};

// Initialize with default endpoint
createWebSocketManager("CHAT");

// WebSocket actions
export const wsActions = {
  changeEndpoint: (endpoint: ModelType) => {
    const currentState = wsState.get();
    wsState.set({
      ...currentState,
      currentEndpoint: endpoint,
      messages: [], // Clear messages when switching endpoints
      error: "",
      loading: false,
      remainingQuestions: MAX_QUESTIONS,
    });
    createWebSocketManager(endpoint);
  },

  sendMessage: (message: string) => {
    const currentState = wsState.get();
    const validationError = validateMessage(message);

    if (validationError) {
      wsState.set({ ...currentState, error: validationError });
      return;
    }

    if (currentState.remainingQuestions <= 0) {
      wsState.set({
        ...currentState,
        error: "Maximum questions reached",
      });
      return;
    }

    if (currentState.isConnected && wsManager) {
      wsState.set({
        ...currentState,
        loading: true,
        mapLoading: currentState.updateMap,
        messages: [...currentState.messages, createUserMessage(message)],
        remainingQuestions: currentState.remainingQuestions - 1,
      });
      wsManager.sendChatMessage(message, currentState.updateMap, true);
    }
  },

  updateFilters: (filters: FilterState) => {
    const currentState = wsState.get();
    if (currentState.isConnected && wsManager) {
      wsState.set({
        ...currentState,
        currentFilters: filters,
        mapLoading: true,
      });
      wsManager.sendFilterUpdate(filters);
    }
  },

  updateCensusTracts: (tracts: string[]) => {
    const currentState = wsState.get();
    if (currentState.isConnected && wsManager) {
      selectedCensusBlocks.set(tracts);
      wsManager.sendCensusUpdate(tracts);
    }
  },

  toggleMapUpdate: (value: boolean) => {
    const currentState = wsState.get();
    wsState.set({
      ...currentState,
      updateMap: value,
    });
  },

  generateSummary: () => {
    const currentState = wsState.get();
    if (currentState.isConnected && wsManager) {
      const selectedTracts = selectedCensusBlocks.get();
      const filters = currentState.currentFilters;

      let summaryPrompt = `Generate an analytical summary`;

      // Only add census tracts if there are selections
      if (selectedTracts && selectedTracts.length > 0) {
        summaryPrompt += `\nSelected Census Tracts: ${selectedTracts.join(", ")}`;
      }

      // Only add filters if they exist and aren't empty
      if (filters && Object.keys(filters).length > 0) {
        summaryPrompt += `\nApplied Filters: ${JSON.stringify(filters)}`;
      }

      wsState.set({
        ...currentState,
        loading: true,
        messages: [
          ...currentState.messages,
          createUserMessage(
            "Generate an analytical summary for my selections."
          ),
        ],
        remainingQuestions: currentState.remainingQuestions - 1,
      });

      wsManager.sendChatMessage(summaryPrompt, undefined, false);
    }
  },

  setMapLoading: (loading: boolean) => {
    const currentState = wsState.get();
    wsState.set({
      ...currentState,
      mapLoading: loading,
    });
  },

  resetChat: () => {
    wsState.set({
      ...wsState.get(),
      messages: [],
      remainingQuestions: MAX_QUESTIONS,
      error: "",
      loading: false,
    });
  },
};

// Export the singleton instance getter
export const getWebSocketManager = () => wsManager;
