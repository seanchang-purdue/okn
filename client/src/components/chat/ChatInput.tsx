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
  placeholder = "Ask a question...",
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
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150);
      textareaRef.current.style.height = `${Math.max(48, newHeight)}px`;
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

  const canSubmit = value.trim().length > 0 && !disabled && !loading;
  const isLowQuestions = remainingQuestions <= 3;
  const isOutOfQuestions = remainingQuestions <= 0;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`relative flex items-end rounded-xl border transition-all duration-150 ${
          disabled || isOutOfQuestions
            ? "bg-gray-50 dark:bg-gray-900 opacity-60"
            : "bg-white dark:bg-gray-900"
        } ${
          isFocused
            ? "border-gray-400 dark:border-gray-600 ring-2 ring-gray-100 dark:ring-gray-800"
            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled || isOutOfQuestions}
          placeholder={isOutOfQuestions ? "Question limit reached" : placeholder}
          maxLength={maxCharacters}
          rows={1}
          className="flex-1 px-4 py-3 pr-12 bg-transparent border-none outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:cursor-not-allowed leading-6"
          style={{ minHeight: "48px", maxHeight: "150px" }}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className={`absolute right-2 bottom-2 w-8 h-8 rounded-lg transition-all duration-150 flex items-center justify-center ${
            canSubmit
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
          }`}
          aria-label="Send message"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <SendIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Footer info */}
      <div className="flex justify-between items-center mt-1.5 px-1">
        <span className="text-[11px] text-gray-400 dark:text-gray-600">
          Shift + Enter for new line
        </span>
        <span className={`text-[11px] tabular-nums ${
          isOutOfQuestions
            ? "text-red-500 dark:text-red-400"
            : isLowQuestions
              ? "text-amber-500 dark:text-amber-400"
              : "text-gray-400 dark:text-gray-600"
        }`}>
          {remainingQuestions} question{remainingQuestions !== 1 ? "s" : ""} left
        </span>
      </div>
    </form>
  );
};

export default ChatInput;
