import { useEffect, useRef, useState } from "react";
import { SendIcon } from "../../icons/send";
import QueryModeToggle from "./QueryModeToggle";

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
  placeholder = "Ask about trends, geography, or demographics...",
  maxCharacters = 1000,
  remainingQuestions = 10,
  loading = false,
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(
      Math.max(textareaRef.current.scrollHeight, 56),
      180
    )}px`;
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || disabled || loading || remainingQuestions <= 0) return;
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || isComposing) return;
    e.preventDefault();
    handleSubmit();
  };

  const canSubmit =
    Boolean(value.trim()) && !disabled && !loading && remainingQuestions > 0;
  const isOutOfQuestions = remainingQuestions <= 0;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`rounded-xl border px-3 py-2 transition-all duration-150 ${
          isFocused
            ? "border-[var(--chat-accent)] shadow-[0_0_0_3px_var(--chat-accent-soft)]"
            : "border-slate-200 dark:border-slate-700"
        } ${
          disabled || isOutOfQuestions
            ? "opacity-70 bg-white dark:bg-slate-900"
            : "bg-white dark:bg-slate-900"
        }`}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled || isOutOfQuestions}
            placeholder={
              isOutOfQuestions
                ? "Question limit reached for this session"
                : placeholder
            }
            maxLength={maxCharacters}
            rows={1}
            className="block w-full resize-none border-none bg-transparent px-1 py-1.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-slate-100 dark:placeholder:text-slate-500"
            style={{ minHeight: "44px", maxHeight: "148px" }}
            aria-label="Chat message"
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <QueryModeToggle />

          <button
            type="submit"
            disabled={!canSubmit}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
              canSubmit
                ? "bg-[var(--chat-accent)] text-white hover:-translate-y-px"
                : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
            }`}
            aria-label="Send message"
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A7.96 7.96 0 0 1 4 12H0c0 3.04 1.14 5.82 3 7.94l3-2.65z"
                />
              </svg>
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
