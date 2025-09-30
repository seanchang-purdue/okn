// src/utils/websocket.ts
import type {
  Message,
  WebSocketPayload,
  WSMessage,
  StatusPayload,
  ResponsePayload,
  ErrorPayload,
} from "../types/chat";
import type { FilterState } from "../types/filters";
import type { WebSocketResponse } from "../types/chat";

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessageCallback: (message: Message) => void;
  private onConnectionChange: (status: boolean) => void;
  private onError: (error: string, code?: string, retryable?: boolean) => void;
  private onGeoJSONUpdate?: (data: GeoJSON.FeatureCollection) => void;
  private onStatusUpdate?: (status: StatusPayload) => void;

  constructor(
    url: string,
    onMessage: (message: Message) => void,
    onConnectionChange: (status: boolean) => void,
    onError: (error: string, code?: string, retryable?: boolean) => void,
    onGeoJSONUpdate?: (data: GeoJSON.FeatureCollection) => void,
    onStatusUpdate?: (status: StatusPayload) => void
  ) {
    this.url = url;
    this.onMessageCallback = onMessage;
    this.onConnectionChange = onConnectionChange;
    this.onError = onError;
    this.onGeoJSONUpdate = onGeoJSONUpdate;
    this.onStatusUpdate = onStatusUpdate;
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

        // Check if it's the new standardized format
        if (this.isNewMessageFormat(message)) {
          this.handleNewFormat(message as WSMessage);
        } else {
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
    return (
      typeof message === "object" &&
      message !== null &&
      "type" in message &&
      "payload" in message &&
      ["status", "response", "error"].includes((message as WSMessage).type)
    );
  }

  private handleNewFormat(message: WSMessage): void {
    switch (message.type) {
      case "status":
        this.handleStatus(message.payload as StatusPayload);
        break;
      case "response":
        this.handleResponse(message.payload as ResponsePayload);
        break;
      case "error":
        this.handleError(message.payload as ErrorPayload);
        break;
      default:
        console.warn("Unknown message type:", message.type);
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

  private handleResponse(payload: ResponsePayload): void {
    switch (payload.task) {
      case "chat":
        // Add chat message to history
        if (payload.message) {
          this.onMessageCallback(payload.message);
        }

        // Update map if GeoJSON data is present
        if (payload.data && this.onGeoJSONUpdate) {
          console.log("Received GeoJSON data from chat response");
          this.onGeoJSONUpdate(payload.data as GeoJSON.FeatureCollection);
        }
        break;

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
    requiresPreviousContext?: boolean
  ): void {
    this.sendMessage({
      type: "chat",
      content,
      isUser: true,
      updateMap,
      requiresPreviousContext,
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
