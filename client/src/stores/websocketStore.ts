// src/stores/websocketStore.ts
import { atom } from "nanostores";
import { WebSocketManager } from "../utils/websocket";
import {
  MAX_QUESTIONS,
  type Message,
  type StatusPayload,
  type ErrorCode,
  type StreamPayload,
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
  streamingMessages: new Map<string, Message>(), // Map of messageId to streaming message
  geoJSONData: null as GeoJSON.FeatureCollection | null,
  loading: false,
  mapLoading: false,
  mapStatusMessage: "",
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

      // Check if this message already exists (from streaming)
      const existingIndex = currentState.messages.findIndex(
        (m) => m.id === message.id
      );

      if (existingIndex >= 0) {
        // Update existing message with chart and quickActions
        const updatedMessages = [...currentState.messages];
        updatedMessages[existingIndex] = {
          ...updatedMessages[existingIndex],
          ...message,
          chart: message.chart,
          quickActions: message.quickActions,
          isComplete: true,
        };

        wsState.set({
          ...currentState,
          messages: updatedMessages,
          loading: false,
        });
      } else {
        // Add new message
        wsState.set({
          ...currentState,
          messages: [...currentState.messages, message],
          loading: false,
        });
      }
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
        mapStatusMessage: "",
        currentStatus: null,
      });
    },
    (data: GeoJSON.FeatureCollection) => {
      const currentState = wsState.get();
      wsState.set({
        ...currentState,
        geoJSONData: data,
        mapLoading: false,
        mapStatusMessage: "",
      });
    },
    (status: StatusPayload) => {
      const currentState = wsState.get();
      wsState.set({
        ...currentState,
        currentStatus: status,
        ...(status.stage === "generating_map" && {
          mapLoading: true,
          mapStatusMessage: status.message || "Updating map...",
        }),
        // Clear status when complete
        ...(status.stage === "complete" && {
          currentStatus: null,
          loading: false,
          mapLoading: false,
          mapStatusMessage: "",
        }),
      });
    },
    (streamPayload: StreamPayload) => {
      const currentState = wsState.get();
      const streamingMessages = new Map(currentState.streamingMessages);

      // Get or create the streaming message
      let streamingMessage = streamingMessages.get(streamPayload.messageId);

      if (!streamingMessage) {
        // Create new streaming message
        streamingMessage = {
          id: streamPayload.messageId,
          type: "system",
          content: "",
          timestamp: Date.now(),
          isComplete: false,
        };
      }

      // Append chunk to content
      streamingMessage.content += streamPayload.chunk;
      streamingMessage.isComplete = streamPayload.isComplete;

      // Update the map
      streamingMessages.set(streamPayload.messageId, streamingMessage);

      // If streaming is complete, move to messages array
      if (streamPayload.isComplete) {
        // Remove from streaming messages
        streamingMessages.delete(streamPayload.messageId);

        // Add to messages array (will be updated with chart/quickActions from response message)
        wsState.set({
          ...currentState,
          messages: [...currentState.messages, streamingMessage],
          streamingMessages,
        });
      } else {
        // Update streaming messages
        wsState.set({
          ...currentState,
          streamingMessages,
        });
      }
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
      mapLoading: false,
      mapStatusMessage: "",
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
        mapLoading: false,
        mapStatusMessage: "",
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
        mapStatusMessage: "Updating map...",
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
      mapStatusMessage: loading
        ? currentState.mapStatusMessage || "Updating map..."
        : "",
    });
  },

  resetChat: () => {
    wsState.set({
      ...wsState.get(),
      messages: [],
      remainingQuestions: MAX_QUESTIONS,
      error: "",
      loading: false,
      mapLoading: false,
      mapStatusMessage: "",
    });
  },
};

// Export the singleton instance getter
export const getWebSocketManager = () => wsManager;
