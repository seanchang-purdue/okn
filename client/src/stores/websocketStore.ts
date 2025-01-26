// src/stores/websocketStore.ts
import { atom } from "nanostores";
import { WebSocketManager } from "../utils/websocket";
import { MAX_QUESTIONS, type Message } from "../types/chat";
import type { FilterState } from "../types/filters";
import { validateMessage, createUserMessage } from "../utils/chat";
import { selectedCensusBlocks } from "./censusStore";

export const wsState = atom({
    isConnected: false,
    error: "",
    messages: [] as Message[],
    geoJSONData: null as GeoJSON.FeatureCollection | null,
    loading: false,
    remainingQuestions: MAX_QUESTIONS,
    currentFilters: {} as FilterState
});

// Create the singleton WebSocket manager
const wsManager = new WebSocketManager(
    `${import.meta.env.PUBLIC_CHATBOT_URL}/chat`,
    (message: Message) => {
        const currentState = wsState.get();
        wsState.set({
            ...currentState,
            messages: [...currentState.messages, message],
            loading: false
        });
    },
    (status: boolean) => {
        const currentState = wsState.get();
        wsState.set({ ...currentState, isConnected: status });
    },
    (error: string) => {
        const currentState = wsState.get();
        wsState.set({ ...currentState, error });
    },
    (data: GeoJSON.FeatureCollection) => {
        const currentState = wsState.get();
        wsState.set({ ...currentState, geoJSONData: data });
    }
);

// WebSocket actions
export const wsActions = {
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
                error: "Maximum questions reached" 
            });
            return;
        }

        if (currentState.isConnected) {
            wsState.set({ 
                ...currentState, 
                loading: true,
                messages: [...currentState.messages, createUserMessage(message)],
                remainingQuestions: currentState.remainingQuestions - 1
            });
            wsManager.sendChatMessage(message);
        }
    },

    updateFilters: (filters: FilterState) => {
        const currentState = wsState.get();
        if (currentState.isConnected) {
            wsState.set({ ...currentState, currentFilters: filters });
            wsManager.sendFilterUpdate(filters);
        }
    },

    updateCensusTracts: (tracts: string[]) => {
        const currentState = wsState.get();
        if (currentState.isConnected) {
            selectedCensusBlocks.set(tracts);
            wsManager.sendCensusUpdate(tracts);
        }
    },

    resetChat: () => {
        wsState.set({
            ...wsState.get(),
            messages: [],
            remainingQuestions: MAX_QUESTIONS,
            error: "",
            loading: false
        });
    }
};

// Initialize connection
wsManager.connect();

// Export the singleton instance getter if still needed
export const getWebSocketManager = () => wsManager;
