"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AskOmniboxProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Bottom-center "Ask" omnibox — the single text-entry surface. It is just the
 * shadcn <Textarea> (its predefined styling = the input box, border, focus
 * ring, and native auto-grow) with a shadcn send <Button>. No custom container.
 */
const AskOmnibox = ({ onSubmit, disabled = false, placeholder }: AskOmniboxProps) => {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const query = draft.trim();
    if (!query || disabled) return;
    onSubmit(query);
    setDraft("");
  };

  return (
    <div role="search" aria-label="Ask a question" className="relative">
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        disabled={disabled}
        rows={1}
        placeholder={placeholder ?? "Ask about gun violence in Philadelphia…"}
        className="max-h-40 resize-none bg-background pr-12"
      />
      <Button
        type="button"
        size="icon"
        onClick={submit}
        disabled={!draft.trim() || disabled}
        aria-label="Send message"
        className="absolute right-2 bottom-2 size-8 rounded-full"
      >
        <ArrowUp className="size-4" />
      </Button>
    </div>
  );
};

export default AskOmnibox;
