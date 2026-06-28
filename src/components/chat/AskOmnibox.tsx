"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import QueryModeToggle from "./QueryModeToggle";

interface AskOmniboxProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Bottom-center "Ask" omnibox — the single text-entry surface, built entirely
 * from shadcn primitives. The parent (ChatMapApp) positions it; this renders
 * just the composer: one rounded container, an auto-growing borderless
 * textarea, the mode toggle, and a round send button. No nested input box.
 */
const AskOmnibox = ({ onSubmit, disabled = false, placeholder }: AskOmniboxProps) => {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow up to a cap.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const submit = () => {
    const query = draft.trim();
    if (!query || disabled) return;
    onSubmit(query);
    setDraft("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const canSubmit = Boolean(draft.trim()) && !disabled;

  return (
    <div
      role="search"
      aria-label="Ask a question"
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-2xl border border-input bg-background p-2 shadow-lg",
        "transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        disabled && "opacity-70"
      )}
    >
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder={placeholder ?? "Ask about gun violence in Philadelphia…"}
        aria-label="Ask a question"
        className="max-h-40 w-full resize-none bg-transparent px-2 pt-1.5 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />

      <div className="flex items-center justify-between gap-2">
        <QueryModeToggle />
        <Button
          type="button"
          size="icon"
          onClick={submit}
          disabled={!canSubmit}
          aria-label="Send message"
          aria-keyshortcuts="Enter"
          className="size-8 rounded-full"
        >
          <ArrowUp className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default AskOmnibox;
