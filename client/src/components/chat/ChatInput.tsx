// src/components/chat/ChatInput.tsx
import { useState, useRef, useEffect } from "react";
import { SendIcon } from "../../icons/send";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxCharacters?: number;
  remainingQuestions?: number;
  maxQuestions?: number;
  loading?: boolean;
}

const ChatInput = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Ask me anything...",
  maxCharacters = 1000,
  remainingQuestions = 10,
  maxQuestions = 10,
  loading = false,
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !loading) {
        onSubmit();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled && !loading) {
      onSubmit();
    }
  };

  const remainingChars = maxCharacters - value.length;
  const canSubmit = value.trim().length > 0 && !disabled && !loading;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`relative flex items-center rounded-2xl border transition-all duration-200 bg-transparent ${
          isFocused
            ? "border-gray-400 dark:border-gray-700"
            : "border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxCharacters}
          rows={1}
          className="flex-1 px-4 py-0 pr-14 bg-transparent border-none outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:cursor-not-allowed"
          style={{ minHeight: "52px", maxHeight: "200px", lineHeight: "52px", verticalAlign: "middle" }}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className={`absolute right-3 w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center ${
            canSubmit
              ? "bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black"
              : "bg-transparent text-gray-300 dark:text-gray-700 cursor-not-allowed"
          }`}
        >
          <SendIcon className="w-4 h-4 flex-shrink-0" />
        </button>
      </div>

      <div className="flex justify-end items-center text-xs mt-1.5 px-1">
        <span className="text-gray-400 dark:text-gray-600">
          {remainingQuestions} / {maxQuestions}
        </span>
      </div>
    </form>
  );
};

export default ChatInput;