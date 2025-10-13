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

  // remaining characters is not displayed; omit to avoid unused var

  return (
    <>
      {messages.length === 0 ? (
        /* Centered Start Layout - ChatBox centered, PresetQuestions below */
        <div className="flex flex-col items-center justify-center px-4 space-y-8">
          {/* Centered ChatBox */}
          <div className="w-full max-w-2xl space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                How can I help you today?
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Ask me anything about the data or choose from the suggestions
                below
              </p>
            </div>

            {/* Chat Input - Centered */}
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
          </div>

          {/* Preset Questions - Below ChatBox */}
          <div className="w-full max-w-2xl">
            <PresetQuestions
              onSelectQuestion={handlePresetClick}
              disabled={!isConnected || loading}
            />
          </div>
        </div>
      ) : (
        /* Chat Mode - Messages at top with map margin, input sticky at bottom */
        <div className="flex flex-col h-full">
          {/* Messages area - Top aligned with map margin */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto pt-8 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="max-w-3xl mx-auto px-8 py-6">
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
              {/* Render streaming messages */}
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
              {currentStatus && <StatusIndicator status={currentStatus} />}
              {loading && !currentStatus && streamingMessages.size === 0 && (
                <TypingIndicator />
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area - Sticky at bottom */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 z-50">
            <div className="max-w-3xl mx-auto px-8 pb-4 pt-3">
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
              <ErrorDisplay
                error={error}
                errorCode={wsState.get().errorCode}
                retryable={wsState.get().retryable}
                onRetry={() => {
                  if (searchValue.trim()) {
                    handleSendMessage(searchValue);
                  }
                }}
                onDismiss={() => {
                  const currentState = wsState.get();
                  wsState.set({
                    ...currentState,
                    error: "",
                    errorCode: "",
                    retryable: false,
                  });
                }}
              />
              {!isConnected && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-2">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                    <span>⚡</span> Disconnected. Trying to reconnect...
                  </p>
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
