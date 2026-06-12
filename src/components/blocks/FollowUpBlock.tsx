import { memo } from "react";
import type { FollowUpBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";
import SuggestionChips from "../ui/SuggestionChips";

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
      <SuggestionChips
        suggestions={data.suggestions.map(({ label, query }) => ({
          label,
          query,
        }))}
        onSelect={onSelectSuggestion}
        disabled={disabled}
      />
    </InsightBlock>
  );
};

export default memo(FollowUpBlock);
