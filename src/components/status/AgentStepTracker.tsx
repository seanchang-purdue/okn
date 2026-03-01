// src/components/status/AgentStepTracker.tsx
"use client";

import { useEffect, useState } from "react";

export interface AgentStep {
  stepNumber: number;
  tool: string;
  description: string;
  status: "calling" | "done";
  rowCount?: number;
  resultLabel?: string;
  startedAt?: number;
  durationMs?: number;
}

/** Isolated live counter so only the in-progress row re-renders every 100ms */
function LiveStepTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const elapsed = ((now - startedAt) / 1000).toFixed(1);
  return (
    <span className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
      {elapsed}s…
    </span>
  );
}

function formatDuration(ms: number): string {
  return (ms / 1000).toFixed(1) + "s";
}

interface AgentStepTrackerProps {
  steps: AgentStep[];
  currentStep: number;
  maxSteps: number;
}

const TOOL_LABELS: Record<string, string> = {
  execute_sql: "SQL",
  query_incidents: "Incidents",
  query_incidents_geojson: "Map data",
  aggregate_data: "Aggregate",
  predict_fatality: "Predict",
  detect_anomalous_tracts: "Anomaly",
  segment_tracts: "Segment",
  lookup_faq: "FAQ",
  get_community_resources: "Resources",
  plan_and_execute: "Plan",
  generate_chart: "Chart",
  generate_markdown: "Markdown",
};

function toolLabel(tool: string): string {
  return TOOL_LABELS[tool] ?? tool;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}

const AgentStepTracker = ({ steps, currentStep, maxSteps }: AgentStepTrackerProps) => {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--chat-muted)]">
          Agent steps
        </span>
        <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
          {currentStep} / {maxSteps}
        </span>
      </div>

      {/* Step list — max 5 rows, scroll if more */}
      <div className="max-h-[120px] overflow-y-auto space-y-1 pr-0.5">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg px-2 py-1.5 bg-slate-100/70 dark:bg-slate-800/50"
          >
            {/* Icon */}
            <span className="mt-px shrink-0 text-[11px] leading-none">
              {step.status === "done" ? (
                // Checkmark SVG
                <svg
                  className="w-3 h-3 text-emerald-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                // Spinner SVG
                <svg
                  className="w-3 h-3 animate-spin text-[var(--chat-accent)]"
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
              )}
            </span>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Tool badge */}
                <span className="rounded px-1 py-0.5 text-[10px] font-mono font-medium leading-none bg-[var(--chat-accent-soft)] text-[var(--chat-accent)]">
                  {toolLabel(step.tool)}
                </span>
                {/* Row count badge (done only) */}
                {step.status === "done" && (step.resultLabel || step.rowCount != null) && (
                  <span className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                    {step.resultLabel ?? `${step.rowCount!.toLocaleString()} rows`}
                  </span>
                )}
                {/* Duration: static for done, live ticker for calling */}
                {step.status === "done" && step.durationMs != null && (
                  <span className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                    {formatDuration(step.durationMs)}
                  </span>
                )}
                {step.status === "calling" && step.startedAt != null && (
                  <LiveStepTimer startedAt={step.startedAt} />
                )}
              </div>
              {/* Description */}
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                {truncate(step.description, 72)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentStepTracker;
