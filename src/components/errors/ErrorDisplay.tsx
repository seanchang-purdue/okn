// src/components/errors/ErrorDisplay.tsx
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div
      role="alert"
      className="rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-destructive"
    >
      <div className="flex items-start gap-2.5">
        {/* Error icon */}
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm">{displayMessage}</p>

          {/* Actions */}
          {(retryable || onDismiss) && (
            <div className="flex items-center gap-2 mt-2">
              {retryable && onRetry && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onRetry}
                >
                  Try again
                </Button>
              )}
              {onDismiss && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Dismiss X button */}
        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDismiss}
            className="-mr-1 -mt-1 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
