import { useState, useEffect, useRef } from "react";
import useChat from "../../hooks/useChat";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import PresetQuestions from "./PresetQuestions";
import StatusIndicator from "../status/StatusIndicator";
import ErrorDisplay from "../errors/ErrorDisplay";
import TypingIndicator from "../loaders/TypingIndicator";
import { MAX_CHARACTERS, MAX_QUESTIONS } from "../../types/chat.js";
import { wsState } from "../../stores/websocketStore";
import type { ModelType } from "../../config/ws";

interface ChatBoxProps {
  selectedQuestion: string;
  onQuestionSent: () => void;
  setShowQuestions: React.Dispatch<React.SetStateAction<boolean>>;
  onChatStateChange?: (isEmpty: boolean) => void;
  onResetChat?: (resetFn: () => void) => void;
  selectedModel: ModelType;
}

const ChatBox = ({
  selectedQuestion,
  onQuestionSent,
  setShowQuestions,
  onChatStateChange,
  onResetChat,
}: ChatBoxProps) => {
  const {
    messages,
    streamingMessages,
    sendMessage,
    isConnected,
    loading,
    error,
    remainingQuestions,
    resetChat,
    currentStatus,
  } = useChat();

  const [searchValue, setSearchValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedQuestion) {
      setSearchValue(selectedQuestion);
      handleSendMessage(selectedQuestion);
      onQuestionSent();
    }
  }, [selectedQuestion]);

  useEffect(() => {
    if (messages.length > 0 || streamingMessages.size > 0) {
      scrollToBottom();
    }
    setShowQuestions(messages.length === 0 && streamingMessages.size === 0);
  }, [messages, streamingMessages, setShowQuestions]);

  useEffect(() => {
    if (onChatStateChange) {
      onChatStateChange(messages.length === 0);
    }
  }, [messages, onChatStateChange]);

  useEffect(() => {
    if (onResetChat) {
      onResetChat = resetChat;
    }
  }, [resetChat, onResetChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (message: string) => {
    if (message.trim() && remainingQuestions > 0) {
      sendMessage(message);
      setSearchValue("");
      setShowQuestions(false);
    }
  };

  const handlePresetClick = (question: string) => {
    setSearchValue(question);
    handleSendMessage(question);
  };

  const clearError = () => {
    const currentState = wsState.get();
    wsState.set({
      ...currentState,
      error: "",
      errorCode: "",
      retryable: false,
    });
  };

  const hasActiveContent = messages.length > 0 || streamingMessages.size > 0;
  const isProcessing = loading || currentStatus !== null;
  const showTypingIndicator = loading && !currentStatus && streamingMessages.size === 0;

  return (
    <>
      {!hasActiveContent ? (
        /* Empty State - Centered welcome */
        <div className="flex flex-col items-center justify-center px-4 space-y-6">
          <div className="w-full max-w-2xl space-y-5">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                What would you like to know?
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ask questions about crime data or explore the suggestions below
              </p>
            </div>

            {/* Input */}
            <ChatInput
              value={searchValue}
              onChange={setSearchValue}
              onSubmit={() => handleSendMessage(searchValue)}
              disabled={!isConnected || loading}
              maxCharacters={MAX_CHARACTERS}
              remainingQuestions={remainingQuestions}
              maxQuestions={MAX_QUESTIONS}
              loading={loading}
            />

            {/* Connection warning */}
            {!isConnected && (
              <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Connecting...</span>
              </div>
            )}
          </div>

          {/* Preset Questions */}
          <div className="w-full max-w-2xl">
            <PresetQuestions
              onSelectQuestion={handlePresetClick}
              disabled={!isConnected || loading}
            />
          </div>
        </div>
      ) : (
        /* Chat Mode */
        <div className="flex flex-col h-full">
          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto scrollbar-hide"
          >
            <div className="max-w-3xl mx-auto px-6 py-4">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message.content}
                  isUser={message.type === "user"}
                  timestamp={message.timestamp}
                  chart={message.chart}
                  quickActions={message.quickActions}
                  isComplete={message.isComplete}
                  onQuickActionClick={handleSendMessage}
                />
              ))}

              {/* Streaming messages */}
              {Array.from(streamingMessages.values()).map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message.content}
                  isUser={message.type === "user"}
                  timestamp={message.timestamp}
                  isComplete={message.isComplete}
                  onQuickActionClick={handleSendMessage}
                />
              ))}

              {/* Status indicator */}
              {currentStatus && <StatusIndicator status={currentStatus} />}

              {/* Typing indicator (fallback when no status) */}
              {showTypingIndicator && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto px-6 py-3">
              <ChatInput
                value={searchValue}
                onChange={setSearchValue}
                onSubmit={() => handleSendMessage(searchValue)}
                disabled={!isConnected || isProcessing}
                maxCharacters={MAX_CHARACTERS}
                remainingQuestions={remainingQuestions}
                maxQuestions={MAX_QUESTIONS}
                loading={isProcessing}
              />

              {/* Error display */}
              <ErrorDisplay
                error={error}
                errorCode={wsState.get().errorCode}
                retryable={wsState.get().retryable}
                onRetry={() => {
                  clearError();
                  if (searchValue.trim()) {
                    handleSendMessage(searchValue);
                  }
                }}
                onDismiss={clearError}
              />

              {/* Disconnection warning */}
              {!isConnected && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Reconnecting...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBox;
