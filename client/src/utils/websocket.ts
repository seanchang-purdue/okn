// src/utils/websocket.ts
import type { Message, WebSocketPayload } from "../types/chat";
import type { FilterState } from "../types/filters";
import type { WebSocketResponse } from "../types/chat";

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessageCallback: (message: Message) => void;
  private onConnectionChange: (status: boolean) => void;
  private onError: (error: string) => void;
  private onGeoJSONUpdate?: (data: GeoJSON.FeatureCollection) => void;

  constructor(
    url: string,
    onMessage: (message: Message) => void,
    onConnectionChange: (status: boolean) => void,
    onError: (error: string) => void,
    onGeoJSONUpdate?: (data: GeoJSON.FeatureCollection) => void
  ) {
    this.url = url;
    this.onMessageCallback = onMessage;
    this.onConnectionChange = onConnectionChange;
    this.onError = onError;
    this.onGeoJSONUpdate = onGeoJSONUpdate;
  }

  connect(): void {
    this.disconnect(); // Ensure any existing connection is closed

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.onConnectionChange(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data) as WebSocketResponse;

        if (response.type === "assistant") {
          if (response.task === "filter_update" && response.data) {
            // Handle GeoJSON update
            console.log("Received GeoJSON data");
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
              console.log("Received GeoJSON data from chat response");
              this.onGeoJSONUpdate(response.data);
            }
          }
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
