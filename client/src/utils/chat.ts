// src/utils/chat.ts
import type { Message } from "../types/chat";
import { MAX_CHARACTERS } from "../types/chat";

export const validateMessage = (message: string): string | null => {
  if (message.length > MAX_CHARACTERS) {
    return `Message exceeds ${MAX_CHARACTERS} characters`;
  }
  return null;
};

export const createUserMessage = (content: string): Message => ({
  id: Date.now().toString(),
  type: "user",
  content,
  timestamp: Date.now(),
});
