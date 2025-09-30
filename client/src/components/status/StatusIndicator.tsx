// src/components/status/StatusIndicator.tsx
import type { StatusPayload } from "../../types/chat";

interface StatusIndicatorProps {
  status: StatusPayload | null;
}

const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  if (!status || status.stage === "complete") {
    return null;
  }

  const getStageColor = (stage: string): string => {
    switch (stage) {
      case "generating_sql":
        return "bg-blue-500";
      case "executing_query":
        return "bg-indigo-500";
      case "retrying_query":
        return "bg-yellow-500";
      case "searching_alternatives":
        return "bg-orange-500";
      case "interpreting_data":
        return "bg-purple-500";
      case "generating_response":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStageIcon = (stage: string): string => {
    switch (stage) {
      case "generating_sql":
        return "⚙️";
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
    <div className="status-indicator bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className="text-2xl animate-pulse">
          {getStageIcon(status.stage)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {status.message}
            </span>
            {status.attempt && status.maxAttempts && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Attempt {status.attempt}/{status.maxAttempts}
              </span>
            )}
          </div>
          {status.progress !== undefined && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ease-out ${getStageColor(status.stage)}`}
                style={{ width: `${status.progress}%` }}
                role="progressbar"
                aria-valuenow={status.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusIndicator;
