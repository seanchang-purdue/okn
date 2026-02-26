// src/components/errors/ErrorDisplay.tsx
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
  MAX_QUESTIONS_EXCEEDED: "You've reached the question limit for this session",
  SQL_EXECUTION_FAILED: "Database query failed. Please try again.",
  AI_COMPLETION_FAILED: "Failed to generate response. Please try again.",
  FILTER_UPDATE_FAILED: "Failed to apply filters. Please try again.",
  CENSUS_UPDATE_FAILED: "Failed to load census data. Please try again.",
  PROCESSING_ERROR: "Something went wrong. Please try again.",
  INVALID_JSON: "Invalid request format. Please try again.",
  UNKNOWN_ERROR: "An unexpected error occurred",
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
    <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
      <div className="flex items-start gap-2.5">
        {/* Error icon */}
        <svg
          className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-700 dark:text-red-300">
            {displayMessage}
          </p>

          {/* Actions */}
          {(retryable || onDismiss) && (
            <div className="flex items-center gap-2 mt-2">
              {retryable && onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline underline-offset-2"
                >
                  Try again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-xs text-red-500 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dismiss X button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 flex-shrink-0"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
