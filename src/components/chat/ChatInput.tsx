import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    ? "text-destructive"
    : remainingQuestions <= 2
      ? "text-warn"
      : "text-muted-foreground";
  const showCharCounter = value.length >= Math.floor(maxCharacters * 0.8);
  const charCounterTone =
    value.length >= maxCharacters * 0.95 ? "text-warn" : "text-muted-foreground";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          "rounded-xl border bg-background px-3 py-2 transition-[color,box-shadow] duration-150",
          isFocused ? "border-ring ring-[3px] ring-ring/50" : "border-input",
          (disabled || isOutOfQuestions) && "opacity-70"
        )}
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
            className="block w-full resize-none border-none bg-transparent px-1 py-1.5 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            style={{ minHeight: "44px", maxHeight: "148px" }}
            aria-label="Chat message"
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <QueryModeToggle />

          <div className="flex shrink-0 items-center gap-3">
            <span
              className={cn("text-caption tabular-nums", questionsCounterTone)}
            >
              {remainingQuestions} left
            </span>

            {showCharCounter && (
              <span className={cn("text-caption tabular-nums", charCounterTone)}>
                {value.length}/{maxCharacters}
              </span>
            )}

            <Button
              type="submit"
              size="icon"
              disabled={!canSubmit}
              aria-label="Send message"
              aria-keyshortcuts="Enter"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <p
        className={cn(
          "h-5 px-1 pt-1 text-caption text-muted-foreground transition-opacity",
          isFocused ? "opacity-100" : "opacity-0"
        )}
        aria-hidden={!isFocused}
      >
        Enter to send · Shift+Enter for new line
      </p>
    </form>
  );
};

export default ChatInput;
