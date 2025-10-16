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
    const retryText =
      attempt && maxAttempts && attempt >= 2
        ? ` (retry ${attempt} of ${maxAttempts})`
        : "";

    switch (stage) {
      case "generating_sql":
        return `Exploring the data${retryText}...`;
      case "executing_query":
        return `Pulling data insights${retryText}...`;
      case "retrying_query":
        return `Rechecking data${retryText}...`;
      case "searching_alternatives":
        return `Exploring additional sources${retryText}...`;
      case "interpreting_data":
        return `Reviewing findings${retryText}...`;
      case "generating_response":
        return `Drafting response${retryText}...`;
      case "generating_map":
        return `Refreshing the map${retryText}...`;
      default:
        return `Processing${retryText}...`;
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
      case "generating_map":
        return "🗺️";
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
