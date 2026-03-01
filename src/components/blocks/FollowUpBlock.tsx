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
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[var(--chat-accent)] hover:text-[var(--chat-accent)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
