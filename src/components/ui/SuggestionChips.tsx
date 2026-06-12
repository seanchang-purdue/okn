interface SuggestionChipsProps {
  suggestions: Array<{ label: string; query: string }>;
  onSelect: (query: string) => void;
  disabled?: boolean;
}

/**
 * Canonical suggestion chip row — used for both backend follow-ups
 * (FollowUpBlock) and client-derived contextual suggestions (InsightPanel)
 * so the two render pixel-identical.
 */
const SuggestionChips = ({
  suggestions,
  onSelect,
  disabled = false,
}: SuggestionChipsProps) => (
  <div className="flex flex-wrap gap-2">
    {suggestions.map((suggestion, index) => (
      <button
        key={`${suggestion.query}-${index}`}
        type="button"
        onClick={() => onSelect(suggestion.query)}
        disabled={disabled}
        className="rounded-md border border-line-1 bg-surface-2 px-3 py-1.5 text-caption font-medium text-ink-1 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {suggestion.label}
      </button>
    ))}
  </div>
);

export default SuggestionChips;
