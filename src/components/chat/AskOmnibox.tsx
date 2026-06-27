"use client";

import { useState } from "react";
import ChatInput from "./ChatInput";

interface AskOmniboxProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Bottom-center "Ask" omnibox over the map — the primary text-entry surface.
 *
 * Layout-neutral: this component renders only the elevated card + ChatInput.
 * The parent (ChatMapApp) is responsible for fixed positioning (bottom-center
 * over the map), clearing the Mapbox attribution row, and respecting the
 * device safe-area inset.
 *
 * ChatInput already renders QueryModeToggle internally — do not add another.
 */
const AskOmnibox = ({ onSubmit, disabled = false, placeholder }: AskOmniboxProps) => {
  const [draft, setDraft] = useState("");

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setDraft("");
  };

  return (
    <div
      role="search"
      aria-label="Ask a question"
      className="w-[min(640px,calc(100%-2rem))] rounded-xl border border-line-1 bg-surface-1 px-3 py-2 shadow-lg"
    >
      <ChatInput
        value={draft}
        onChange={setDraft}
        onSubmit={handleSubmit}
        disabled={disabled}
        placeholder={placeholder ?? "Ask about gun violence in Philadelphia…"}
      />
    </div>
  );
};

export default AskOmnibox;
