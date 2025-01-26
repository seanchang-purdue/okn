// src/utils/websocket.ts
import type { Message, WebSocketPayload } from "../types/chat";
import type { FilterState } from "../types/filters";
import type { WebSocketResponse, MessageResponse } from "../types/chat";

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
    onGeoJSONUpdate?: (data: GeoJSON.FeatureCollection) => void,
  ) {
    this.url = url;
    this.onMessageCallback = onMessage;
    this.onConnectionChange = onConnectionChange;
    this.onError = onError;
    this.onGeoJSONUpdate = onGeoJSONUpdate;
  }

  connect(): void {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.onConnectionChange(true);
    };

    this.ws.onmessage = (event) => {
        try {
            const response = JSON.parse(event.data) as WebSocketResponse;
    
            if ('data' in response && response.task === "filter_update") {
                // Handle GeoJSON update
                console.log("Received GeoJSON data");
                if (this.onGeoJSONUpdate) {
                    this.onGeoJSONUpdate(response.data);
                }
            } else if ('messages' in response) {
                // Handle regular messages
                response.messages.forEach(message => {
                    this.onMessageCallback(message);
                });
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

  sendMessage(payload: WebSocketPayload): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.onError("Socket is not connected");
    }
  }

  sendChatMessage(content: string): void {
    this.sendMessage({
      type: "chat",
      content,
      isUser: true,
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
