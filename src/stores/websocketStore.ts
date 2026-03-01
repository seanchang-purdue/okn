// src/stores/websocketStore.ts
import { atom } from "nanostores";
import { WebSocketManager } from "../utils/websocket";
import {
  MAX_QUESTIONS,
  type Message,
  type StatusPayload,
  type ErrorCode,
  type StreamPayload,
  type ResponseBlockPayload,
  type Artifact,
} from "../types/chat";
import type { FilterState } from "../types/filters";
import { validateMessage, createUserMessage } from "../utils/chat";
import { selectedCensusBlocks } from "./censusStore";
import type { ModelType } from "../config/ws";
import { MODEL_CONFIGS } from "../config/ws";
import { insightActions, insightState } from "./insightStore";
import { queryModeStore } from "./chatLayoutStore";
import type {
  InsightBlock,
  InsightBlockType,
  TextInsightBlock,
} from "../types/insight";

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
let pendingInsightBlockId: string | null = null;
const structuredResponseMessageIds = new Set<string>();

const DEFAULT_CHAT_CONTEXT =
  (process.env.NEXT_PUBLIC_CHAT_DEFAULT_CONTEXT || "").trim();

const withDefaultChatContext = (message: string) => {
  if (!DEFAULT_CHAT_CONTEXT) return message;
  const normalizedMessage = message.toLowerCase();
  const normalizedContext = DEFAULT_CHAT_CONTEXT.toLowerCase();
  if (normalizedMessage.includes(normalizedContext)) return message;
  return `${message}\n\n${DEFAULT_CHAT_CONTEXT}`;
};

const makePendingInsightBlockId = () =>
  `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getInsightBlock = (id: string) =>
  insightState.get().blocks.find((block) => block.id === id);

const getTextBlock = (id: string): TextInsightBlock | undefined => {
  const block = getInsightBlock(id);
  return block?.type === "text" ? (block as TextInsightBlock) : undefined;
};

const toTextBlockData = (content: string): TextInsightBlock["data"] => ({
  markdown: content,
});

const getBlockTextContent = (data: unknown): string => {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  if (typeof record["markdown"] === "string") return record["markdown"];
  if (typeof record["message"] === "string") return record["message"];
  if (typeof record["summary"] === "string") return record["summary"];
  return "";
};

const appendPendingTextBlock = (query: string) => {
  pendingInsightBlockId = makePendingInsightBlockId();
  insightActions.appendBlock({
    id: pendingInsightBlockId,
    type: "text",
    data: toTextBlockData(""),
    timestamp: Date.now(),
    streaming: true,
    query,
  });
};

const appendChartBlockIfMissing = (messageId: string, chart: string) => {
  const chartBlockId = `${messageId}:chart`;
  if (getInsightBlock(chartBlockId)) return;

  insightActions.appendBlock({
    id: chartBlockId,
    type: "chart",
    data: {
      chartType: "response",
      imageUrl: chart,
    },
    timestamp: Date.now(),
    streaming: false,
    query: insightState.get().currentQuery ?? undefined,
  });
};

const appendArtifactBlocksIfMissing = (
  messageId: string,
  artifacts: Artifact[]
) => {
  artifacts.forEach((art) => {
    const blockId = `${messageId}:artifact:${art.id}`;
    if (getInsightBlock(blockId)) return;

    const query = insightState.get().currentQuery ?? undefined;
    if (art.type === "chart") {
      insightActions.appendBlock({
        id: blockId,
        type: "chart",
        data: { chartType: "response", imageUrl: art.content, title: art.title },
        timestamp: Date.now(),
        streaming: false,
        query,
      });
    } else {
      insightActions.appendBlock({
        id: blockId,
        type: "text",
        data: { markdown: art.content },
        timestamp: Date.now(),
        streaming: false,
        query,
      });
    }
  });
};

const appendFollowUpBlockIfMissing = (
  messageId: string,
  quickActions: NonNullable<Message["quickActions"]>
) => {
  const followUpBlockId = `${messageId}:follow-up`;
  if (getInsightBlock(followUpBlockId)) return;

  insightActions.appendBlock({
    id: followUpBlockId,
    type: "follow-up",
    data: {
      suggestions: quickActions.map((action) => ({
        label: action.label,
        query: action.query,
        icon: action.icon,
      })),
    },
    timestamp: Date.now(),
    streaming: false,
    query: insightState.get().currentQuery ?? undefined,
  });
};

const VALID_BLOCK_TYPES: InsightBlockType[] = [
  "text",
  "stat",
  "chart",
  "table",
  "comparison",
  "map-action",
  "source",
  "follow-up",
];

const isInsightBlockType = (value: string): value is InsightBlockType =>
  VALID_BLOCK_TYPES.includes(value as InsightBlockType);

const appendStructuredBlocks = (
  messageId: string,
  blocks: ResponseBlockPayload[]
) => {
  if (blocks.length === 0) return;

  structuredResponseMessageIds.add(messageId);
  const hasTextBlock = blocks.some((block) => block.type === "text");

  if (hasTextBlock) {
    insightActions.removeBlock(messageId);
    if (pendingInsightBlockId) {
      insightActions.removeBlock(pendingInsightBlockId);
      pendingInsightBlockId = null;
    }
  }

  blocks.forEach((block, index) => {
    const blockType = String(block.type);
    if (!isInsightBlockType(blockType)) return;

    const rawId =
      typeof block.id === "string" && block.id.trim().length > 0
        ? block.id
        : `${messageId}:block:${index}`;

    const existing = getInsightBlock(rawId);

    const nextBlock: InsightBlock = {
      id: rawId,
      type: blockType,
      data: block.data as InsightBlock["data"],
      timestamp: block.timestamp ?? Date.now(),
      streaming: block.streaming ?? false,
      query:
        block.query ??
        insightState.get().currentQuery ??
        undefined,
      semanticType: block.semanticType,
      role: block.role,
      meta: block.meta,
    } as InsightBlock;

    if (existing) {
      insightActions.updateBlock(rawId, nextBlock);
    } else {
      insightActions.appendBlock(nextBlock);
    }

    if (
      nextBlock.type === "text" &&
      (nextBlock.semanticType === "failure" || nextBlock.role === "failure")
    ) {
      const message = getBlockTextContent(nextBlock.data);
      if (message.trim().length > 0) {
        const currentState = wsState.get();
        wsState.set({
          ...currentState,
          error: message,
          errorCode: "PROCESSING_ERROR",
          retryable: true,
          loading: false,
        });
      }
    }
  });
};

const finalizeTextInsightBlock = (message: Message) => {
  const messageTextBlock = getTextBlock(message.id);

  if (messageTextBlock) {
    const nextContent =
      message.content && message.content.trim().length > 0
        ? message.content
        : messageTextBlock.data.markdown;

    insightActions.updateBlock(message.id, {
      data: toTextBlockData(nextContent),
      streaming: false,
      timestamp: message.timestamp || Date.now(),
      query: messageTextBlock.query ?? insightState.get().currentQuery ?? undefined,
    });
    return;
  }

  if (pendingInsightBlockId) {
    const pendingBlock = getTextBlock(pendingInsightBlockId);
    if (pendingBlock) {
      insightActions.updateBlock(pendingInsightBlockId, {
        id: message.id,
        data: toTextBlockData(message.content || pendingBlock.data.markdown),
        streaming: false,
        timestamp: message.timestamp || Date.now(),
        query: pendingBlock.query ?? insightState.get().currentQuery ?? undefined,
      } as Partial<InsightBlock>);
      pendingInsightBlockId = null;
      return;
    }
    pendingInsightBlockId = null;
  }

  insightActions.appendBlock({
    id: message.id,
    type: "text",
    data: toTextBlockData(message.content || ""),
    timestamp: message.timestamp || Date.now(),
    streaming: false,
    query: insightState.get().currentQuery ?? undefined,
  });
};

const createWebSocketManager = (endpoint: ModelType) => {
  // Disconnect existing connection if any
  if (wsManager) {
    wsManager.disconnect();
  }

  // Create new WebSocket manager with selected endpoint
  wsManager = new WebSocketManager(
    `${process.env.NEXT_PUBLIC_CHATBOT_URL}${MODEL_CONFIGS[endpoint]}`,
    (message: Message) => {
      // Debug: log received message
      console.log("[WS] Message callback received:", {
        id: message.id,
        hasChart: !!message.chart,
        quickActions: message.quickActions,
        contentLength: message.content?.length,
      });

      // Get fresh state to avoid race conditions with streaming
      const currentState = wsState.get();

      // Check if this message already exists (from streaming)
      const existingIndex = currentState.messages.findIndex(
        (m) => m.id === message.id
      );

      if (existingIndex >= 0) {
        // Update existing message with chart and quickActions
        const updatedMessages = [...currentState.messages];
        updatedMessages[existingIndex] = {
          ...updatedMessages[existingIndex],
          // Only update content if the incoming message has content
          ...(message.content && { content: message.content }),
          chart: message.chart || updatedMessages[existingIndex].chart,
          quickActions: message.quickActions || updatedMessages[existingIndex].quickActions,
          isComplete: true,
        };

        wsState.set({
          ...currentState,
          messages: updatedMessages,
          loading: false,
        });
      } else {
        // Message doesn't exist, add it
        wsState.set({
          ...currentState,
          messages: [...currentState.messages, { ...message, isComplete: true }],
          loading: false,
        });
      }

      const hasStructuredBlocks = structuredResponseMessageIds.has(message.id);

      if (hasStructuredBlocks) {
        const hasTextBlock = insightState
          .get()
          .blocks.some(
            (block) =>
              block.type === "text" &&
              (block.id === message.id ||
                block.id.startsWith(`${message.id}:block:`))
          );

        if (!hasTextBlock && message.content.trim().length > 0) {
          finalizeTextInsightBlock(message);
        }
        if (pendingInsightBlockId) {
          insightActions.removeBlock(pendingInsightBlockId);
          pendingInsightBlockId = null;
        }
      } else {
        finalizeTextInsightBlock(message);
        if (message.artifacts?.length) {
          appendArtifactBlocksIfMissing(message.id, message.artifacts);
        } else if (message.chart) {
          appendChartBlockIfMissing(message.id, message.chart);
        }
        if (message.quickActions && message.quickActions.length > 0) {
          appendFollowUpBlockIfMissing(message.id, message.quickActions);
        }
      }

      structuredResponseMessageIds.delete(message.id);
      insightActions.setLoading(false);
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
      if (pendingInsightBlockId) {
        const pendingBlock = getTextBlock(pendingInsightBlockId);
        if (pendingBlock) {
          insightActions.updateBlock(pendingInsightBlockId, {
            data: toTextBlockData(
              pendingBlock.data.markdown || "Request failed. Please try again."
            ),
            streaming: false,
          });
        }
      }
      pendingInsightBlockId = null;
      structuredResponseMessageIds.clear();
      insightActions.setLoading(false);
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
        // Backend is asking the user to rephrase — stop the loading spinner so
        // the input is re-enabled and they can type a follow-up.
        ...(status.stage === "needs_clarification" && {
          loading: false,
        }),
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
      if (status.stage === "complete") {
        insightActions.setLoading(false);
      }
    },
    (streamPayload: StreamPayload) => {
      // Get fresh state for each stream chunk
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

        // Get fresh state and check if message already exists
        const latestState = wsState.get();
        const alreadyExists = latestState.messages.some(
          (m) => m.id === streamPayload.messageId
        );

        if (!alreadyExists) {
          // Add to messages array with isComplete=false
          // The response handler will set isComplete=true and add chart/quickActions
          wsState.set({
            ...latestState,
            messages: [...latestState.messages, { ...streamingMessage, isComplete: false }],
            streamingMessages,
          });
        } else {
          // Just clear the streaming messages
          wsState.set({
            ...latestState,
            streamingMessages,
          });
        }
      } else {
        // Update streaming messages
        wsState.set({
          ...currentState,
          streamingMessages,
        });
      }

      const existingTextBlock = getTextBlock(streamPayload.messageId);
      const chunk = streamPayload.chunk ?? "";

      if (existingTextBlock) {
        const nextMarkdown = `${existingTextBlock.data.markdown}${chunk}`;
        insightActions.updateBlock(streamPayload.messageId, {
          data: toTextBlockData(nextMarkdown),
          streaming: !streamPayload.isComplete,
        });
      } else if (pendingInsightBlockId) {
        const pendingBlock = getTextBlock(pendingInsightBlockId);
        if (pendingBlock) {
          insightActions.updateBlock(pendingInsightBlockId, {
            id: streamPayload.messageId,
            data: toTextBlockData(`${pendingBlock.data.markdown}${chunk}`),
            streaming: !streamPayload.isComplete,
          } as Partial<InsightBlock>);
          pendingInsightBlockId = null;
        } else {
          pendingInsightBlockId = null;
        }
      } else if (chunk.length > 0 || !streamPayload.isComplete) {
        insightActions.appendBlock({
          id: streamPayload.messageId,
          type: "text",
          data: toTextBlockData(chunk),
          timestamp: Date.now(),
          streaming: !streamPayload.isComplete,
          query: insightState.get().currentQuery ?? undefined,
        });
      }

      if (streamPayload.isComplete) {
        insightActions.updateBlock(streamPayload.messageId, {
          streaming: false,
        });
      }
    },
    (messageId: string, blocks: ResponseBlockPayload[]) => {
      appendStructuredBlocks(messageId, blocks);
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
      streamingMessages: new Map<string, Message>(),
      error: "",
      loading: false,
      mapLoading: false,
      mapStatusMessage: "",
      remainingQuestions: MAX_QUESTIONS,
    });
    pendingInsightBlockId = null;
    structuredResponseMessageIds.clear();
    insightActions.clearBlocks();
    createWebSocketManager(endpoint);
  },

  sendMessage: (message: string) => {
    const currentState = wsState.get();
    const outboundMessage = withDefaultChatContext(message);
    const validationError = validateMessage(outboundMessage);

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
      insightActions.setCurrentQuery(message);
      insightActions.setLoading(true);
      appendPendingTextBlock(message);

      wsState.set({
        ...currentState,
        loading: true,
        // Clear any lingering clarification status so the indicator resets
        // before the backend sends the first status of the new request.
        currentStatus: null,
        mapLoading: false,
        mapStatusMessage: "",
        messages: [...currentState.messages, createUserMessage(message)],
        remainingQuestions: currentState.remainingQuestions - 1,
      });
      wsManager.sendChatMessage(outboundMessage, currentState.updateMap, true, queryModeStore.get());
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
      insightActions.setCurrentQuery(
        "Generate an analytical summary for my selections."
      );
      insightActions.setLoading(true);
      appendPendingTextBlock("Generate an analytical summary for my selections.");

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
      streamingMessages: new Map<string, Message>(),
      remainingQuestions: MAX_QUESTIONS,
      error: "",
      loading: false,
      mapLoading: false,
      mapStatusMessage: "",
    });
    pendingInsightBlockId = null;
    structuredResponseMessageIds.clear();
    insightActions.clearBlocks();
  },
};

// Export the singleton instance getter
export const getWebSocketManager = () => wsManager;
