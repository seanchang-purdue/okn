import { useState, type KeyboardEvent } from "react";
import GeographyResults from "./GeographyResults";
import type { GeographyResult } from "../../hooks/useGeographySearch";

interface GeographySearchInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: GeographyResult[];
  loading: boolean;
  error: string;
  onSelect: (result: GeographyResult) => void;
  onClear: () => void;
}

const GeographySearchInput = ({
  query,
  onQueryChange,
  results,
  loading,
  error,
  onSelect,
  onClear,
}: GeographySearchInputProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" && results.length > 0) {
      onSelect(results[0]);
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex h-9 items-center gap-2 rounded-xl border border-[var(--chat-border)] bg-[color:var(--chat-panel-strong)] px-2.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4 text-[var(--chat-muted)]"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search address, county, district, POI"
          className="w-full bg-transparent text-[13px] text-[var(--chat-title)] outline-none placeholder:text-[var(--chat-muted)] dark:text-slate-100"
        />

        {query && (
          <button
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--chat-muted)] hover:bg-[var(--chat-accent-soft)]"
            aria-label="Clear geography search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <GeographyResults
          results={results}
          loading={loading}
          error={error}
          query={query}
          onSelect={(result) => {
            onSelect(result);
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default GeographySearchInput;
