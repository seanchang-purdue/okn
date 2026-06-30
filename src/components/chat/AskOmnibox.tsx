"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

interface AskOmniboxProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_HEIGHT = 120; // ~5 lines at leading-6 (24px), then it scrolls

/**
 * Bottom-center "Ask" omnibox — a CUSTOM floating composer (intentionally not
 * shadcn): a soft rounded panel with backdrop blur and no border, a borderless
 * auto-growing textarea, and a round send button at the bottom-right.
 */
const AskOmnibox = ({ onSubmit, disabled = false, placeholder }: AskOmniboxProps) => {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
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
      className="flex w-full flex-col gap-1 rounded-2xl bg-background/75 p-2.5 shadow-lg backdrop-blur-md transition-shadow focus-within:shadow-xl supports-[backdrop-filter]:bg-background/65"
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
        className="w-full resize-none overflow-y-auto bg-transparent px-2 pt-1 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        style={{ maxHeight: MAX_HEIGHT }}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          aria-label="Send message"
          aria-keyshortcuts="Enter"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default AskOmnibox;
