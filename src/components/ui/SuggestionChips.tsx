import { Button } from "@/components/ui/button";

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
      <Button
        key={`${suggestion.query}-${index}`}
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onSelect(suggestion.query)}
        disabled={disabled}
        className="h-auto whitespace-normal text-left font-normal"
      >
        {suggestion.label}
      </Button>
    ))}
  </div>
);

export default SuggestionChips;
