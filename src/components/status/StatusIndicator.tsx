// src/components/status/StatusIndicator.tsx
"use client";

import type { StatusPayload, StatusStage } from "../../types/chat";
import { isAgentPipeline } from "../../utils/pipeline";

interface StatusIndicatorProps {
  status: StatusPayload | null;
}

// Simplified phases - more user-friendly
const PHASES = [
  {
    id: "routing",
    label: "Routing",
    stages: ["request_accepted", "route_selected"] as StatusStage[],
  },
  {
    id: "planning",
    label: "Planning",
    stages: [
      "needs_clarification",
      "plan_started",
      "plan_ready",
      "classifying_query",
      "planning_queries",
      "agent_thinking",
    ] as StatusStage[],
  },
  {
    id: "querying",
    label: "Querying",
    stages: [
      "tool_started",
      "tool_completed",
      "generating_sql",
      "validating_sql",
      "executing_query",
      "retrying_query",
      "searching_alternatives",
      "validation_failed",
      "agent_tool_call",
      "agent_tool_result",
    ] as StatusStage[],
  },
  {
    id: "analyzing",
    label: "Analyzing",
    stages: [
      "synthesis_started",
      "processing_results",
      "interpreting_data",
      "synthesizing",
      "agent_synthesizing",
    ] as StatusStage[],
  },
  {
    id: "responding",
    label: "Responding",
    stages: [
      "generating_response",
      "streaming_response",
      "generating_chart",
      "generating_map",
    ] as StatusStage[],
  },
];

export const getStageInfo = (stage: StatusStage): { text: string } => {
  const stageTexts: Record<StatusStage, string> = {
    needs_clarification: "Need more information",
    request_accepted: "Accepted request",
    route_selected: "Selecting execution path",
    plan_started: "Building plan",
    plan_ready: "Plan ready",
    tool_started: "Running tool",
    tool_completed: "Tool complete",
    validation_failed: "Validation failed",
    synthesis_started: "Synthesizing evidence",
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
    agent_thinking: "Analyzing your question",
    agent_tool_call: "Running analysis tool",
    agent_tool_result: "Processing tool results",
    agent_synthesizing: "Synthesizing answer",
    generating_response: "Generating response",
    streaming_response: "Writing response",
    generating_chart: "Creating visualization",
    generating_map: "Preparing map data",
    complete: "Complete",
  };
  return { text: stageTexts[stage] || "Processing" };
};

export const getCurrentPhaseIndex = (stage: StatusStage): number => {
  return PHASES.findIndex((phase) => phase.stages.includes(stage));
};

const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  if (!status || status.stage === "complete" || status.stage === "generating_map") {
    return null;
  }

  const { text } = getStageInfo(status.stage);
  const progress = status.progress ?? 0;
  const isRetrying = status.attempt != null && status.attempt >= 2;
  const agentPi = isAgentPipeline(status.phaseInfo) ? status.phaseInfo : null;

  return (
    <div className="border-b border-border bg-muted px-4 py-2">
      {/* Row 1: spinner + stage text + step counter + percentage */}
      <div className="flex items-center gap-2">
        {/* Spinner */}
        <svg
          className="h-3.5 w-3.5 shrink-0 animate-spin text-primary"
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

        {/* Stage text + optional sub-step + inline agent step counter */}
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {text}
          {status.subStep && (
            <span className="ml-1 text-muted-foreground">
              ({status.subStep})
            </span>
          )}
          {agentPi && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {" "}· Step {agentPi.step} of {agentPi.maxSteps}
            </span>
          )}
        </span>

        {/* Progress percentage */}
        <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Row 2: progress bar */}
      <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Retry warning */}
      {isRetrying && (
        <div className="mt-1 flex items-center gap-1.5 text-xs tabular-nums text-amber-600 dark:text-amber-500">
          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Attempt {status.attempt} of {status.maxAttempts}</span>
        </div>
      )}

      {/* Multi-query hint for fixed pipeline */}
      {!isAgentPipeline(status.phaseInfo) &&
        status.phaseInfo?.totalQueries != null &&
        status.phaseInfo.totalQueries > 1 && (
          <div className="mt-1 text-xs tabular-nums text-muted-foreground">
            Running {status.phaseInfo.totalQueries} parallel queries
          </div>
        )}
    </div>
  );
};

export default StatusIndicator;
