import { useCallback, useEffect, useRef, useState } from "react";
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
  textareaRef?: React.Ref<HTMLTextAreaElement>;
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
  textareaRef: forwardedTextareaRef,
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const assignTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node;
      if (typeof forwardedTextareaRef === "function") {
        forwardedTextareaRef(node);
      } else if (forwardedTextareaRef) {
        (
          forwardedTextareaRef as React.MutableRefObject<HTMLTextAreaElement | null>
        ).current = node;
      }
    },
    [forwardedTextareaRef]
  );

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

  const questionsCounterTone = isOutOfQuestions
    ? "text-negative"
    : remainingQuestions <= 2
      ? "text-warn"
      : "text-ink-3";
  const showCharCounter = value.length >= Math.floor(maxCharacters * 0.8);
  const charCounterTone =
    value.length >= maxCharacters * 0.95 ? "text-warn" : "text-ink-3";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`rounded-xl border px-3 py-2 transition-all duration-150 ${
          isFocused
            ? "border-accent shadow-[0_0_0_3px_var(--accent-soft)]"
            : "border-line-1"
        } ${
          disabled || isOutOfQuestions
            ? "opacity-70 bg-surface-1"
            : "bg-surface-1"
        }`}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={assignTextareaRef}
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
            className="block w-full resize-none border-none bg-transparent px-1 py-1.5 text-sm leading-6 text-ink-1 outline-none placeholder:text-ink-3 disabled:cursor-not-allowed"
            style={{ minHeight: "44px", maxHeight: "148px" }}
            aria-label="Chat message"
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <QueryModeToggle />

          <div className="flex shrink-0 items-center gap-3">
            <span
              className={`text-caption tabular-nums ${questionsCounterTone}`}
            >
              {remainingQuestions} left
            </span>

            {showCharCounter && (
              <span className={`text-caption tabular-nums ${charCounterTone}`}>
                {value.length}/{maxCharacters}
              </span>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                canSubmit
                  ? "bg-accent text-white hover:opacity-90"
                  : "bg-surface-2 text-ink-3 cursor-not-allowed"
              }`}
              aria-label="Send message"
              aria-keyshortcuts="Enter"
            >
              {loading ? (
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
      </div>

      <p
        className={`h-5 px-1 pt-1 text-caption text-ink-3 transition-opacity ${
          isFocused ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!isFocused}
      >
        Enter to send · Shift+Enter for new line
      </p>
    </form>
  );
};

export default ChatInput;
