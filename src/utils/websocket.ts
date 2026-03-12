// src/utils/websocket.ts
import type {
  Message,
  WebSocketPayload,
  WSMessage,
  StatusPayload,
  StatusStage,
  ResponsePayload,
  ResponseBlockPayload,
  ErrorPayload,
  StreamPayload,
  QuickAction,
  AgentEventPayload,
  Artifact,
} from "../types/chat";
import type { FilterState } from "../types/filters";
import type { WebSocketResponse } from "../types/chat";
import type {
  InsightBlockType,
  SemanticBlockType,
  TextBlockRole,
  MapActionBlockData,
} from "../types/insight";

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessageCallback: (message: Message) => void;
  private onConnectionChange: (status: boolean) => void;
  private onError: (error: string, code?: string, retryable?: boolean) => void;
  private onGeoJSONUpdate?: (data: GeoJSON.FeatureCollection) => void;
  private onStatusUpdate?: (status: StatusPayload) => void;
  private onStreamUpdate?: (payload: StreamPayload) => void;
  private onBlocksUpdate?: (
    messageId: string,
    blocks: ResponseBlockPayload[]
  ) => void;

  constructor(
    url: string,
    onMessage: (message: Message) => void,
    onConnectionChange: (status: boolean) => void,
    onError: (error: string, code?: string, retryable?: boolean) => void,
    onGeoJSONUpdate?: (data: GeoJSON.FeatureCollection) => void,
    onStatusUpdate?: (status: StatusPayload) => void,
    onStreamUpdate?: (payload: StreamPayload) => void,
    onBlocksUpdate?: (
      messageId: string,
      blocks: ResponseBlockPayload[]
    ) => void
  ) {
    this.url = url;
    this.onMessageCallback = onMessage;
    this.onConnectionChange = onConnectionChange;
    this.onError = onError;
    this.onGeoJSONUpdate = onGeoJSONUpdate;
    this.onStatusUpdate = onStatusUpdate;
    this.onStreamUpdate = onStreamUpdate;
    this.onBlocksUpdate = onBlocksUpdate;
  }

  connect(): void {
    this.disconnect(); // Ensure any existing connection is closed

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.onConnectionChange(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("📨 Raw WebSocket message received:", message);

        // Check if it's the new standardized format
        if (this.isNewMessageFormat(message)) {
          console.log("✅ Using new message format");
          this.handleNewFormat(message as WSMessage);
        } else {
          console.log("⚠️ Using legacy format");
          // Handle legacy format for backward compatibility
          this.handleLegacyFormat(message as WebSocketResponse);
        }
      } catch (error) {
        this.onError((error as Error).message);
      }
    };

    this.ws.onclose = () => {
      this.onConnectionChange(false);
    };

    this.ws.onerror = () => {
      this.onError("WebSocket error occurred");
      this.onConnectionChange(false);
    };
  }

  private isNewMessageFormat(message: unknown): boolean {
    if (typeof message !== "object" || message === null) {
      console.log("🔍 Not an object or null");
      return false;
    }

    const msg = message as Record<string, unknown>;
    const hasType = Object.prototype.hasOwnProperty.call(msg, "type");
    const hasPayload = Object.prototype.hasOwnProperty.call(msg, "payload");
    const typeValue = msg["type"] as unknown as string;
    const isValidType = ["status", "response", "error", "stream", "event"].includes(
      typeValue
    );

    console.log("🔍 Message format check:", {
      hasType,
      hasPayload,
      typeValue,
      isValidType,
      fullMessage: msg,
    });

    return hasType && hasPayload && isValidType;
  }

  private handleNewFormat(message: WSMessage): void {
    console.log("📬 Handling new format message type:", message.type);
    switch (message.type) {
      case "status":
        console.log("📊 Processing status update:", message.payload);
        this.handleStatus(message.payload as StatusPayload);
        break;
      case "stream":
        console.log("🌊 Processing stream chunk:", message.payload);
        this.handleStream(message.payload as StreamPayload);
        break;
      case "response":
        console.log("💬 Processing response:", message.payload);
        this.handleResponse(message.payload as ResponsePayload);
        break;
      case "error":
        console.log("❌ Processing error:", message.payload);
        this.handleError(message.payload as ErrorPayload);
        break;
      case "event":
        console.log("🧭 Processing agent event:", message.payload);
        this.handleAgentEvent(message.payload as AgentEventPayload);
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
  }

  private handleAgentEvent(payload: AgentEventPayload): void {
    // Stream deltas for block-based protocol
    if (payload.type === "block.stream.delta") {
      const streamPayload = normalizeAgentStreamPayload(payload.data);
      if (streamPayload) {
        this.handleStream(streamPayload);
      }
      return;
    }

    // Atomic block emissions
    if (payload.type === "block.emitted") {
      const emitted = normalizeAgentBlockEmission(payload.data);
      if (emitted && this.onBlocksUpdate) {
        this.onBlocksUpdate(emitted.messageId, emitted.blocks);
      }
      return;
    }

    if (payload.type === "response.error") {
      const errorPayload = normalizeAgentErrorPayload(payload.data);
      this.handleError(errorPayload);
      return;
    }

    if (payload.type === "response.completed") {
      const responsePayload = normalizeAgentResponsePayload(payload.data);
      if (responsePayload) {
        this.handleResponse(responsePayload);
      }
      if (this.onStatusUpdate) {
        this.onStatusUpdate({
          stage: "complete",
          message: "Complete",
          progress: 100,
        });
      }
      return;
    }

    const statusPayload = normalizeAgentStatusPayload(payload);
    if (statusPayload) {
      this.handleStatus(statusPayload);
    }
  }

  private handleStatus(payload: StatusPayload): void {
    console.log(
      `[Status] ${payload.stage}: ${payload.message}`,
      payload.progress ? `(${payload.progress}%)` : ""
    );

    // Update status UI
    if (this.onStatusUpdate) {
      this.onStatusUpdate(payload);
    }

    // Clear status when complete
    if (payload.stage === "complete" && this.onStatusUpdate) {
      setTimeout(() => {
        this.onStatusUpdate!(payload);
      }, 1000);
    }
  }

  private handleStream(payload: StreamPayload): void {
    console.log(
      `[Stream] messageId: ${payload.messageId}, chunk: "${payload.chunk}", isComplete: ${payload.isComplete}`
    );

    // Update streaming message
    if (this.onStreamUpdate) {
      this.onStreamUpdate(payload);
    }
  }

  private handleResponse(payload: ResponsePayload): void {
    const payloadRecord = payload as unknown as Record<string, unknown>;

    // Debug: log raw response payload
    console.log("[WS] handleResponse payload:", {
      task: payload.task,
      messageId: payload.messageId,
      hasMessage: !!payload.message,
      hasChart: !!payload.chart,
      hasArtifacts: !!(payload.artifacts?.length),
      quickActions: payload.quickActions ?? payloadRecord["quick_actions"],
      hasBlocks: !!(payloadRecord["blocks"] ?? payload.blocks),
    });

    const structuredBlocks = normalizeResponseBlocks(
      payloadRecord["blocks"] ?? payload.blocks
    );
    const messageId =
      payload.messageId ||
      payload.message?.id ||
      String(payloadRecord["messageId"] ?? "") ||
      (structuredBlocks?.[0]?.id ?? "");

    if (messageId && structuredBlocks && this.onBlocksUpdate) {
      this.onBlocksUpdate(messageId, structuredBlocks);
    }

    switch (payload.task) {
      case "chat": {
        if (messageId) {
          // Create update message with chart/quickActions
          // The store will handle deduplication - if message exists from streaming,
          // it will update it; otherwise it will add it
          const updateMessage: Message = {
            id: messageId,
            type: "system",
            content: payload.message?.content || "",
            timestamp: payload.message?.timestamp || Date.now(),
            chart: payload.chart,
            artifacts: payload.artifacts,
            quickActions: normalizeQuickActions(
              payload.quickActions ?? payloadRecord["quick_actions"]
            ),
            isComplete: true,
          };
          this.onMessageCallback(updateMessage);
        }

        // Update map if GeoJSON data is present
        if (payload.data && this.onGeoJSONUpdate) {
          console.log("Received GeoJSON data from chat response");
          this.onGeoJSONUpdate(payload.data as GeoJSON.FeatureCollection);
        }
        break;
      }

      case "filter_update":
        // Update map with filtered data
        if (payload.data && this.onGeoJSONUpdate) {
          console.log("Received GeoJSON data from filter update");
          this.onGeoJSONUpdate(payload.data as GeoJSON.FeatureCollection);
        }
        break;

      case "census_update":
        // Update census panel
        console.log("Received census update");
        // Census data handling can be added here if needed
        break;

      default:
        console.warn("Unknown task type:", payload.task);
    }
  }

  private handleError(payload: ErrorPayload): void {
    console.error(
      `[Error ${payload.code}]: ${payload.message}`,
      payload.details
    );

    // Show error to user
    this.onError(payload.message, payload.code, payload.retryable);
  }

  private handleLegacyFormat(response: WebSocketResponse): void {
    // Legacy format handling for backward compatibility
    if (response.type === "assistant") {
      if (response.task === "filter_update" && response.data) {
        // Handle GeoJSON update
        console.log("Received GeoJSON data (legacy format)");
        if (this.onGeoJSONUpdate) {
          this.onGeoJSONUpdate(response.data);
        }
      } else if ("messages" in response) {
        // Handle regular messages
        response.messages.forEach((message) => {
          this.onMessageCallback(message);
        });

        // Check for GeoJSON data in chat response
        if (response.data && this.onGeoJSONUpdate) {
          console.log(
            "Received GeoJSON data from chat response (legacy format)"
          );
          this.onGeoJSONUpdate(response.data);
        }
      }
    }
  }

  disconnect(): void {
    if (this.ws) {
      // Remove all event listeners to prevent memory leaks
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;

      // Close the connection if it's not already closed
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }

      this.ws = null;
      this.onConnectionChange(false);
    }
  }

  sendMessage(payload: WebSocketPayload): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.onError("Socket is not connected");
    }
  }

  sendChatMessage(
    content: string,
    updateMap?: boolean,
    requiresPreviousContext?: boolean,
    mode?: "auto" | "research",
    filters?: FilterState
  ): void {
    this.sendMessage({
      type: "chat",
      content,
      isUser: true,
      updateMap,
      requiresPreviousContext,
      ...(mode && { mode }),
      ...(filters && { filters }),
    });
  }

  sendFilterUpdate(filters: FilterState): void {
    this.sendMessage({
      type: "filter_update",
      isUser: true,
      content: JSON.stringify(filters),
    });
  }

  sendCensusUpdate(censusTracts: string[]): void {
    this.sendMessage({
      type: "census_update",
      isUser: true,
      censusTracts,
    });
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

const FRONTEND_BLOCK_TYPES: InsightBlockType[] = [
  "text",
  "stat",
  "chart",
  "table",
  "comparison",
  "map-action",
  "source",
  "follow-up",
];

const AGENT_EVENT_STAGE_MAP: Partial<Record<AgentEventPayload["type"], StatusStage>> =
  {
    "request.accepted": "request_accepted",
    "route.selected": "route_selected",
    "plan.started": "plan_started",
    "plan.ready": "plan_ready",
    "tool.started": "tool_started",
    "tool.completed": "tool_completed",
    "validation.failed": "validation_failed",
    "synthesis.started": "synthesis_started",
  };

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const isTaskType = (value: unknown): value is ResponsePayload["task"] =>
  value === "chat" || value === "filter_update" || value === "census_update";

const toSemanticType = (value: unknown): SemanticBlockType | undefined => {
  if (typeof value !== "string") return undefined;
  switch (value) {
    case "plan":
    case "finding":
    case "map_action":
    case "evidence":
    case "follow_up":
    case "failure":
      return value;
    default:
      return undefined;
  }
};

const toWireType = (rawType: string): InsightBlockType | undefined => {
  if (FRONTEND_BLOCK_TYPES.includes(rawType as InsightBlockType)) {
    return rawType as InsightBlockType;
  }
  switch (rawType) {
    case "plan":
    case "finding":
    case "failure":
      return "text";
    case "map_action":
      return "map-action";
    case "evidence":
      return "source";
    case "follow_up":
      return "follow-up";
    default:
      return undefined;
  }
};

const toTextRole = (
  role: unknown,
  semanticType: SemanticBlockType | undefined,
  rawType: string
): TextBlockRole | undefined => {
  if (role === "plan" || role === "finding" || role === "failure") {
    return role;
  }
  if (
    semanticType === "plan" ||
    semanticType === "finding" ||
    semanticType === "failure"
  ) {
    return semanticType;
  }
  if (rawType === "plan" || rawType === "finding" || rawType === "failure") {
    return rawType;
  }
  return undefined;
};

const normalizeMapActionName = (
  value: unknown
): MapActionBlockData["action"] | undefined => {
  if (typeof value !== "string") return undefined;
  switch (value) {
    case "flyTo":
    case "fly_to":
    case "fly-to":
      return "flyTo";
    case "highlight":
    case "highlight_geoids":
      return "highlight";
    case "filter":
    case "set_filter":
      return "filter";
    case "toggleLayer":
    case "toggle_layer":
      return "toggleLayer";
    default:
      return undefined;
  }
};

const normalizeMapActionData = (raw: unknown): unknown => {
  const record = toRecord(raw);
  if (!record) return raw;

  const action = normalizeMapActionName(record["action"] ?? record["kind"]);
  if (!action) return raw;

  const paramsRecord = toRecord(record["params"]) ?? {};
  const params: Record<string, unknown> = { ...paramsRecord };

  if (action === "flyTo") {
    if (!params.center && Array.isArray(record["center"])) {
      params.center = record["center"];
    }
    if (!params.zoom && typeof record["zoom"] === "number") {
      params.zoom = record["zoom"];
    }
  }

  if (action === "highlight" && !params.geoids && Array.isArray(record["geoids"])) {
    params.geoids = record["geoids"];
  }

  if (action === "filter") {
    if (!params.expression && record["expression"]) params.expression = record["expression"];
    if (!params.field && typeof record["field"] === "string") {
      params.field = record["field"];
    }
    if (!params.values && Array.isArray(record["values"])) {
      params.values = record["values"];
    }
  }

  if (action === "toggleLayer") {
    if (!params.layerId && typeof record["layerId"] === "string") {
      params.layerId = record["layerId"];
    }
    if (typeof params.visible === "undefined" && typeof record["visible"] === "boolean") {
      params.visible = record["visible"];
    }
  }

  const defaultDescription: Record<MapActionBlockData["action"], string> = {
    flyTo: "Moved map viewport.",
    highlight: "Highlighted selected geography.",
    filter: "Applied map filter.",
    toggleLayer: "Updated layer visibility.",
  };

  const description =
    typeof record["description"] === "string"
      ? record["description"]
      : typeof record["rationale"] === "string"
        ? record["rationale"]
        : defaultDescription[action];

  return {
    action,
    params,
    description,
  } satisfies MapActionBlockData;
};

const normalizeBlockMeta = (
  value: unknown
): ResponseBlockPayload["meta"] | undefined => {
  const record = toRecord(value);
  if (!record) return undefined;

  const confidence =
    typeof record["confidence"] === "number" ? record["confidence"] : undefined;

  const caveats = Array.isArray(record["caveats"])
    ? record["caveats"]
        .map((item) => (typeof item === "string" ? item : null))
        .filter((item): item is string => Boolean(item))
    : undefined;

  const sourceRefs = Array.isArray(record["sourceRefs"])
    ? record["sourceRefs"]
        .map((item) => {
          const source = toRecord(item);
          if (!source) return null;
          const label =
            typeof source["label"] === "string" ? source["label"] : undefined;
          const detail =
            typeof source["detail"] === "string" ? source["detail"] : undefined;
          const url = typeof source["url"] === "string" ? source["url"] : undefined;
          return { label, detail, url };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : undefined;

  if (
    typeof confidence === "undefined" &&
    (!caveats || caveats.length === 0) &&
    (!sourceRefs || sourceRefs.length === 0)
  ) {
    return undefined;
  }

  return {
    ...(typeof confidence === "number" ? { confidence } : {}),
    ...(caveats && caveats.length > 0 ? { caveats } : {}),
    ...(sourceRefs && sourceRefs.length > 0 ? { sourceRefs } : {}),
  };
};

function normalizeResponseBlocks(
  input: unknown
): ResponseBlockPayload[] | undefined {
  if (!input) return undefined;
  if (!Array.isArray(input)) return undefined;

  const blocks: ResponseBlockPayload[] = [];

  input.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    if (typeof record["type"] !== "string") return;

    const rawType = String(record["type"]);
    const semanticType =
      toSemanticType(record["semanticType"]) ?? toSemanticType(rawType);
    const wireType = toWireType(rawType);
    if (!wireType) return;

    const role = toTextRole(record["role"], semanticType, rawType);
    const rawData = record["data"];

    blocks.push({
      id: typeof record["id"] === "string" ? record["id"] : undefined,
      type: wireType,
      data:
        wireType === "map-action"
          ? normalizeMapActionData(rawData)
          : rawData,
      timestamp:
        typeof record["timestamp"] === "number"
          ? record["timestamp"]
          : undefined,
      streaming:
        typeof record["streaming"] === "boolean"
          ? record["streaming"]
          : undefined,
      query:
        typeof record["query"] === "string" ? record["query"] : undefined,
      semanticType,
      role,
      meta: normalizeBlockMeta(record["meta"]),
    });
  });

  return blocks.length > 0 ? blocks : undefined;
}

function normalizeAgentStatusPayload(
  payload: AgentEventPayload
): StatusPayload | null {
  const stage = AGENT_EVENT_STAGE_MAP[payload.type];
  if (!stage) return null;

  const data = toRecord(payload.data) ?? {};
  const message =
    typeof data["message"] === "string"
      ? data["message"]
      : payload.type.replace(/\./g, " ");

  const phaseInfoRecord = toRecord(data["phaseInfo"]);
  const phaseInfo =
    phaseInfoRecord && typeof phaseInfoRecord["phase"] === "string"
      ? ({
          phase: phaseInfoRecord["phase"],
          ...phaseInfoRecord,
        } as import("../types/chat").PhaseInfo)
      : undefined;

  return {
    stage,
    message,
    progress: typeof data["progress"] === "number" ? data["progress"] : undefined,
    subStep: typeof data["subStep"] === "string" ? data["subStep"] : undefined,
    currentSubStep:
      typeof data["currentSubStep"] === "number" ? data["currentSubStep"] : undefined,
    totalSubSteps:
      typeof data["totalSubSteps"] === "number" ? data["totalSubSteps"] : undefined,
    estimatedTimeMs:
      typeof data["estimatedTimeMs"] === "number" ? data["estimatedTimeMs"] : undefined,
    phaseInfo,
  };
}

function normalizeAgentStreamPayload(data: unknown): StreamPayload | null {
  const record = toRecord(data);
  if (!record) return null;

  const messageId =
    (typeof record["messageId"] === "string" && record["messageId"]) ||
    (typeof record["blockId"] === "string" && record["blockId"]) ||
    (typeof record["id"] === "string" && record["id"]) ||
    "";
  if (!messageId) return null;

  const task = isTaskType(record["task"]) ? record["task"] : "chat";
  const chunk =
    typeof record["chunk"] === "string"
      ? record["chunk"]
      : typeof record["delta"] === "string"
        ? record["delta"]
        : "";
  const isComplete =
    typeof record["isComplete"] === "boolean" ? record["isComplete"] : false;
  const sessionId =
    typeof record["sessionId"] === "string"
      ? record["sessionId"]
      : typeof record["requestId"] === "string"
        ? record["requestId"]
        : "agent-event";

  return {
    task,
    chunk,
    messageId,
    isComplete,
    sessionId,
  };
}

function normalizeAgentBlockEmission(data: unknown): {
  messageId: string;
  blocks: ResponseBlockPayload[];
} | null {
  const record = toRecord(data);
  if (!record) return null;

  const rawBlocks = Array.isArray(record["blocks"])
    ? record["blocks"]
    : record["block"]
      ? [record["block"]]
      : [];
  const blocks = normalizeResponseBlocks(rawBlocks);
  if (!blocks || blocks.length === 0) return null;

  const messageId =
    (typeof record["messageId"] === "string" && record["messageId"]) ||
    (typeof record["requestId"] === "string" && record["requestId"]) ||
    (typeof record["blockId"] === "string" && record["blockId"]) ||
    (typeof blocks[0].id === "string" ? blocks[0].id : "");

  if (!messageId) return null;
  return { messageId, blocks };
}

function normalizeAgentErrorPayload(data: unknown): ErrorPayload {
  const record = toRecord(data) ?? {};
  const rawCode =
    typeof record["code"] === "string" ? record["code"] : "PROCESSING_ERROR";

  const allowedCodes = new Set<ErrorPayload["code"]>([
    "SQL_EXECUTION_FAILED",
    "INVALID_MESSAGE",
    "MESSAGE_TOO_LONG",
    "MAX_QUESTIONS_EXCEEDED",
    "PROCESSING_ERROR",
    "INVALID_JSON",
    "UNKNOWN_ERROR",
    "AI_COMPLETION_FAILED",
    "FILTER_UPDATE_FAILED",
    "CENSUS_UPDATE_FAILED",
  ]);

  const code = allowedCodes.has(rawCode as ErrorPayload["code"])
    ? (rawCode as ErrorPayload["code"])
    : "PROCESSING_ERROR";

  return {
    code,
    message:
      typeof record["message"] === "string"
        ? record["message"]
        : "Agent execution failed.",
    retryable:
      typeof record["retryable"] === "boolean" ? record["retryable"] : true,
    details: toRecord(record["details"]) ?? undefined,
  };
}

function normalizeAgentResponsePayload(data: unknown): ResponsePayload | null {
  const record = toRecord(data);
  if (!record) return null;

  const task = isTaskType(record["task"]) ? record["task"] : "chat";
  const sessionId =
    typeof record["sessionId"] === "string"
      ? record["sessionId"]
      : typeof record["requestId"] === "string"
        ? record["requestId"]
        : "agent-event";

  const messageId =
    typeof record["messageId"] === "string" ? record["messageId"] : undefined;
  const messageContent =
    typeof record["content"] === "string" ? record["content"] : undefined;

  const message =
    task === "chat" && messageId
      ? ({
          id: messageId,
          type: "assistant",
          content: messageContent ?? "",
          timestamp: Date.now(),
          isComplete: true,
        } satisfies Message)
      : undefined;

  return {
    task,
    sessionId,
    message,
    data: record["data"] as ResponsePayload["data"],
    chart: typeof record["chart"] === "string" ? record["chart"] : undefined,
    quickActions: normalizeQuickActions(
      record["quickActions"] ?? record["quick_actions"]
    ),
    blocks: normalizeResponseBlocks(record["blocks"]),
  };
}

// Normalize quick actions payloads that may arrive as object maps
function normalizeQuickActions(q: unknown): QuickAction[] | undefined {
  if (!q) return undefined;
  if (Array.isArray(q)) return q as QuickAction[];

  if (typeof q === "object") {
    const entries = Object.entries(q as Record<string, unknown>);
    const items = entries
      .filter(([k, v]) => {
        if (!v || typeof v !== "object") return false;
        if (k === "sessionId") return false; // skip metadata keys
        const obj = v as { label?: unknown; query?: unknown };
        return (
          typeof obj.label !== "undefined" && typeof obj.query !== "undefined"
        );
      })
      .map(([k, v]) => ({ key: k, val: v as Record<string, unknown> }))
      .sort((a, b) => {
        const ai = Number.isFinite(+a.key) ? +a.key : Number.MAX_SAFE_INTEGER;
        const bi = Number.isFinite(+b.key) ? +b.key : Number.MAX_SAFE_INTEGER;
        return ai - bi;
      })
      .map(({ val }) => ({
        label: String((val as Record<string, unknown>)["label"] ?? "Action"),
        query: String((val as Record<string, unknown>)["query"] ?? ""),
        icon: String((val as Record<string, unknown>)["icon"] ?? "✨"),
      }))
      .filter((qa) => qa.query.length > 0);

    return items.length ? items : undefined;
  }
  return undefined;
}
