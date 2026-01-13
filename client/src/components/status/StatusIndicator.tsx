// src/components/status/StatusIndicator.tsx
import type { StatusPayload, StatusStage } from "../../types/chat";

interface StatusIndicatorProps {
  status: StatusPayload | null;
}

// Simplified phases - more user-friendly
const PHASES = [
  { id: "understanding", label: "Understanding", stages: ["classifying_query", "planning_queries"] as StatusStage[] },
  { id: "querying", label: "Querying", stages: ["generating_sql", "validating_sql", "executing_query", "retrying_query", "searching_alternatives"] as StatusStage[] },
  { id: "analyzing", label: "Analyzing", stages: ["processing_results", "interpreting_data", "synthesizing"] as StatusStage[] },
  { id: "responding", label: "Responding", stages: ["generating_response", "streaming_response", "generating_chart", "generating_map"] as StatusStage[] },
];

const getStageInfo = (stage: StatusStage): { text: string } => {
  const stageTexts: Record<StatusStage, string> = {
    classifying_query: "Understanding your question",
    planning_queries: "Planning the approach",
    generating_sql: "Building database query",
    validating_sql: "Validating query",
    executing_query: "Fetching data",
    retrying_query: "Retrying query",
    searching_alternatives: "Trying alternative approach",
    processing_results: "Processing results",
    interpreting_data: "Analyzing data",
    synthesizing: "Combining insights",
    generating_response: "Generating response",
    streaming_response: "Writing response",
    generating_chart: "Creating visualization",
    generating_map: "Preparing map data",
    complete: "Complete",
  };
  return { text: stageTexts[stage] || "Processing" };
};

const getCurrentPhaseIndex = (stage: StatusStage): number => {
  return PHASES.findIndex((phase) => phase.stages.includes(stage));
};

const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  // Don't show for map updates or when complete
  if (!status || status.stage === "complete" || status.stage === "generating_map") {
    return null;
  }

  const { text } = getStageInfo(status.stage);
  const currentPhaseIndex = getCurrentPhaseIndex(status.stage);
  const progress = status.progress ?? 0;
  const isRetrying = status.attempt && status.attempt >= 2;

  return (
    <div className="py-3">
      <div className="space-y-3">
        {/* Minimal step indicator */}
        <div className="flex items-center gap-1.5">
          {PHASES.map((phase, index) => (
            <div key={phase.id} className="flex items-center gap-1.5">
              {/* Step dot */}
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index < currentPhaseIndex
                    ? "bg-blue-500"
                    : index === currentPhaseIndex
                      ? "bg-blue-500 ring-4 ring-blue-500/20"
                      : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
              {/* Connector line */}
              {index < PHASES.length - 1 && (
                <div
                  className={`w-8 h-0.5 transition-colors duration-300 ${
                    index < currentPhaseIndex
                      ? "bg-blue-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Status text and progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Spinner */}
            <svg
              className="w-3.5 h-3.5 text-blue-500 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {/* Text */}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {text}
              {status.subStep && (
                <span className="text-gray-400 dark:text-gray-500 ml-1">
                  ({status.subStep})
                </span>
              )}
            </span>
          </div>

          {/* Progress percentage */}
          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Retry warning */}
        {isRetrying && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Attempt {status.attempt} of {status.maxAttempts}</span>
          </div>
        )}

        {/* Additional info */}
        {status.phaseInfo?.totalQueries && status.phaseInfo.totalQueries > 1 && (
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Running {status.phaseInfo.totalQueries} parallel queries
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;
