import { useState, useEffect, useCallback, useRef } from "react";
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
  resetChat: () => void;
};

const useChat = (url: string): ChatHook => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remainingQuestions, setRemainingQuestions] = useState(MAX_QUESTIONS);

  const socketRef = useRef<WebSocket | null>(null);
  const mounted = useRef(true);

  const setupWebSocket = useCallback(() => {
    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Clear messages when setting up new connection
    setMessages([]);
    setRemainingQuestions(MAX_QUESTIONS);
    setError("");
    setLoading(false);

    const ws = new WebSocket(url);

    ws.onopen = () => {
      if (mounted.current) {
        setIsConnected(true);
        setError("");
      }
    };

    ws.onmessage = (event) => {
      if (!mounted.current) return;

      try {
        const response = JSON.parse(event.data);
        console.log(response);
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
      if (mounted.current) {
        setIsConnected(false);
        setLoading(false);
        setError("");
      }
    };

    ws.onerror = () => {
      if (mounted.current) {
        setError("WebSocket error occurred");
        setIsConnected(false);
        setLoading(false);
      }
    };

    socketRef.current = ws;
  }, [url]);

  // Reset everything when URL changes
  useEffect(() => {
    setupWebSocket();
  }, [url, setupWebSocket]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setLoading(false);
    setError("");
    setRemainingQuestions(MAX_QUESTIONS);
    setupWebSocket();
  }, [setupWebSocket]);

  const sendMessage = useCallback(
    (message: string) => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        if (message.length > MAX_CHARACTERS) {
          setError(`Message exceeds ${MAX_CHARACTERS} characters`);
          return;
        }

        if (remainingQuestions <= 0) {
          setError(
            "You have reached the maximum number of questions for this session",
          );
          return;
        }

        setLoading(true);
        socketRef.current.send(
          JSON.stringify({ content: message, isUser: true }),
        );
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
    [remainingQuestions],
  );

  // Initial setup
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const handleReconnect = () => {
      if (mounted.current && !isConnected) {
        reconnectTimeout = setTimeout(() => {
          setupWebSocket();
        }, 3000); // Retry every 3 seconds
      }
    };

    if (!isConnected) {
      handleReconnect();
    }

    return () => {
      clearTimeout(reconnectTimeout);
    };
  }, [isConnected, setupWebSocket]);

  return {
    messages,
    sendMessage,
    isConnected,
    loading,
    error,
    remainingQuestions,
    resetChat,
  };
};

export default useChat;