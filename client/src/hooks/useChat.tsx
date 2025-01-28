// src/hooks/useChat.ts
import { useStore } from "@nanostores/react";
import type { ChatHook } from "../types/chat";
import { wsState, wsActions } from "../stores/websocketStore";

const useChat = (): ChatHook => {
  const state = useStore(wsState);

  return {
    messages: state.messages,
    sendMessage: wsActions.sendMessage,
    isConnected: state.isConnected,
    loading: state.loading,
    error: state.error,
    remainingQuestions: state.remainingQuestions,
    resetChat: wsActions.resetChat,
    updateFilters: wsActions.updateFilters,
    updateCensusTracts: wsActions.updateCensusTracts,
    generateSummary: wsActions.generateSummary,
  };
};

export default useChat;
