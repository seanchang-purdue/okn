// src/components/errors/ErrorDisplay.tsx
import { Button } from "@heroui/react";
import type { ErrorCode } from "../../types/chat";

interface ErrorDisplayProps {
  error: string;
  errorCode?: ErrorCode | "";
  retryable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_MESSAGE: "Please provide a valid message",
  MESSAGE_TOO_LONG: "Your message is too long. Please shorten it.",
  MAX_QUESTIONS_EXCEEDED:
    "You've reached the maximum number of questions for this session",
  SQL_EXECUTION_FAILED: "Failed to execute database query. Please try again.",
  AI_COMPLETION_FAILED: "Failed to generate response. Please try again.",
  FILTER_UPDATE_FAILED: "Failed to apply filters. Please try again.",
  CENSUS_UPDATE_FAILED: "Failed to load census data. Please try again.",
  PROCESSING_ERROR: "An error occurred while processing your request",
  INVALID_JSON: "Invalid message format. Please try again.",
  UNKNOWN_ERROR: "An unexpected error occurred",
};

const getErrorIcon = (code?: ErrorCode | ""): string => {
  if (!code) return "⚠️";

  switch (code) {
    case "INVALID_MESSAGE":
    case "MESSAGE_TOO_LONG":
      return "✏️";
    case "MAX_QUESTIONS_EXCEEDED":
      return "🚫";
    case "SQL_EXECUTION_FAILED":
    case "AI_COMPLETION_FAILED":
      return "❌";
    case "FILTER_UPDATE_FAILED":
    case "CENSUS_UPDATE_FAILED":
      return "🔄";
    default:
      return "⚠️";
  }
};

const ErrorDisplay = ({
  error,
  errorCode,
  retryable = false,
  onRetry,
  onDismiss,
}: ErrorDisplayProps) => {
  if (!error) return null;

  const displayMessage =
    errorCode && ERROR_MESSAGES[errorCode] ? ERROR_MESSAGES[errorCode] : error;

  return (
    <div className="error-display bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{getErrorIcon(errorCode)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                Error
                {errorCode && (
                  <span className="ml-2 text-xs font-mono bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded">
                    {errorCode}
                  </span>
                )}
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                {displayMessage}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-lg flex-shrink-0"
                aria-label="Dismiss error"
              >
                ×
              </button>
            )}
          </div>
          {retryable && onRetry && (
            <div className="mt-3">
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onClick={onRetry}
                className="text-xs"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
