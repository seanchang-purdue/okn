import { memo } from "react";
import type { FollowUpBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";

interface FollowUpBlockProps {
  data: FollowUpBlockData;
  onSelectSuggestion: (query: string) => void;
  disabled?: boolean;
}

const FollowUpBlock = ({
  data,
  onSelectSuggestion,
  disabled = false,
}: FollowUpBlockProps) => {
  return (
    <InsightBlock title="Suggested follow-ups">
      <div className="flex flex-wrap gap-2">
        {data.suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.query}-${index}`}
            type="button"
            onClick={() => onSelectSuggestion(suggestion.query)}
            disabled={disabled}
            className="rounded-md border border-line-1 bg-surface-2 px-3 py-1.5 text-caption font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suggestion.icon ? `${suggestion.icon} ` : ""}
            {suggestion.label}
          </button>
        ))}
      </div>
    </InsightBlock>
  );
};

export default memo(FollowUpBlock);
