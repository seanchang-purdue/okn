// src/components/status/StatusIndicator.tsx
import type { StatusPayload } from "../../types/chat";

interface StatusIndicatorProps {
  status: StatusPayload | null;
}

const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  if (!status || status.stage === "complete") {
    return null;
  }

  const getUserFriendlyMessage = (status: StatusPayload): string => {
    const { stage, attempt, maxAttempts } = status;
    const attemptText = attempt && maxAttempts && attempt >= 2 ? ` (attempt ${attempt} of ${maxAttempts})` : '';

    switch (stage) {
      case "generating_sql":
        return `Finding data${attemptText}...`;
      case "executing_query":
        return `Searching for data${attemptText}...`;
      case "retrying_query":
        return `Retrying search${attemptText}...`;
      case "searching_alternatives":
        return `Looking for alternative data sources${attemptText}...`;
      case "interpreting_data":
        return "Analyzing results...";
      case "generating_response":
        return "Preparing response...";
      default:
        return "Processing...";
    }
  };

  const getStageIcon = (stage: string): string => {
    switch (stage) {
      case "generating_sql":
      case "executing_query":
        return "🔍";
      case "retrying_query":
        return "🔄";
      case "searching_alternatives":
        return "🔎";
      case "interpreting_data":
        return "📊";
      case "generating_response":
        return "✍️";
      default:
        return "⏳";
    }
  };

  return (
    <div className="status-indicator mb-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
          {getStageIcon(status.stage)} {getUserFriendlyMessage(status)}
        </span>
      </div>
    </div>
  );
};

export default StatusIndicator;
