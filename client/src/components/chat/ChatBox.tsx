import { useState, useEffect, useRef } from "react";
import { Button, CircularProgress, Textarea } from "@heroui/react";
import { SendIcon } from "../../icons/send.jsx";
import useChat from "../../hooks/useChat";
import ChatBubble from "./ChatBubble";
import { MAX_CHARACTERS, MAX_QUESTIONS } from "../../../types/chat.js";
import { type ModelType, getWsUrl } from "../../config/ws";

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
  selectedModel,
}: ChatBoxProps) => {
  const {
    messages,
    sendMessage,
    isConnected,
    loading,
    error,
    remainingQuestions,
    resetChat,
  } = useChat(getWsUrl(selectedModel));

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
    scrollToBottom();
    setShowQuestions(messages.length === 0);
  }, [messages, setShowQuestions]);

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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length <= MAX_CHARACTERS) {
      setSearchValue(event.target.value);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleSendMessage = (message: string) => {
    if (message.trim() && remainingQuestions > 0) {
      sendMessage(message);
      setSearchValue("");
      setShowQuestions(false);
    }
  };

  const handleSubmit = (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();
    handleSendMessage(searchValue);
  };

  const remainingCharacters = MAX_CHARACTERS - searchValue.length;

  return (
    <div
      className={`flex flex-col ${messages.length === 0 ? "" : "h-[calc(100vh-90px)]"}`}
    >
      <div
        ref={chatContainerRef}
        className="flex-grow overflow-y-auto mb-4 p-4"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message.content}
            isUser={message.type === "user"}
            timestamp={message.timestamp}
          />
        ))}
        {loading && (
          <div className="flex justify-start items-center mt-4">
            <CircularProgress color="primary" size="sm" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-auto mb-12">
        <form onSubmit={handleSubmit} className="w-full">
          <Textarea
            label="Questions"
            placeholder="Ask me anything"
            value={searchValue}
            disabled={!isConnected || messages.length === MAX_QUESTIONS}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            endContent={
              <Button
                type="submit"
                variant="light"
                isIconOnly
                disabled={loading || remainingQuestions === 0}
              >
                <SendIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 flex-shrink-0 w-8 h-8" />
              </Button>
            }
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{remainingCharacters} characters left</span>
            <span>{remainingQuestions} questions left</span>
          </div>
        </form>
        {error && <p className="text-red-500">Error: {error}</p>}
        {!isConnected && (
          <p className="text-yellow-500">
            Disconnected. Trying to reconnect...
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
