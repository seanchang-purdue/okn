import { useState, useEffect, useCallback } from "react";
import { MAX_CHARACTERS, MAX_QUESTIONS } from "../../types/chat";

type Message = {
  id: string;
  type: "user" | "system" | "assistant";
  content: string;
  timestamp: number;
};

type ChatHook = {
  messages: Message[];
  sendMessage: (message: string) => void;
  isConnected: boolean;
  loading: boolean;
  error: string;
  remainingQuestions: number;
};

const useChat = (url: string): ChatHook => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remainingQuestions, setRemainingQuestions] = useState(MAX_QUESTIONS);

  const sendMessage = useCallback(
    (message: string) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        if (message.length > MAX_CHARACTERS) {
          setError(`Message exceeds ${MAX_CHARACTERS} characters`);
          return;
        }
        
        if (remainingQuestions <= 0) {
          setError("You have reached the maximum number of questions for this session");
          return;
        }

        setLoading(true);
        socket.send(JSON.stringify({ content: message, isUser: true }));
        const userMessage: Message = {
          id: Date.now().toString(),
          type: "user",
          content: message,
          timestamp: Date.now(),
        };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setRemainingQuestions((prev) => prev - 1);
      } else {
        setError("Socket is not connected");
      }
    },
    [socket, remainingQuestions],
  );

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      setError("");
    };

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        if (response.messages && Array.isArray(response.messages)) {
          setMessages(response.messages);
        } else if (
          response.type === "system" ||
          response.type === "assistant"
        ) {
          setMessages((prevMessages) => [...prevMessages, response]);
        }
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setLoading(false);
      setError("");
      setRemainingQuestions(MAX_QUESTIONS);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  return {
    messages,
    sendMessage,
    isConnected,
    loading,
    error,
    remainingQuestions,
  };
};

export default useChat;
