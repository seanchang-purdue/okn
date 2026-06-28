// src/components/status/AgentStepTracker.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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

  return (
    <span className="tabular-nums">{((now - startedAt) / 1000).toFixed(1)}s</span>
  );
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

const toolLabel = (tool: string): string => TOOL_LABELS[tool] ?? tool;

interface AgentStepTrackerProps {
  steps: AgentStep[];
}

/**
 * A subtle, Claude-style "thinking" timeline: each reasoning step is a small dot
 * on a thin vertical line, with the step's thought text beside it. No counters.
 */
const AgentStepTracker = ({ steps }: AgentStepTrackerProps) => {
  if (steps.length === 0) return null;

  return (
    <ol className="relative space-y-2.5">
      {/* the connecting line */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[3px] top-2 bottom-2 w-px bg-border"
      />

      {steps.map((step, i) => {
        const active = step.status === "calling";
        return (
          <li key={i} className="relative pl-5">
            {/* dot on the line */}
            <span
              aria-hidden
              className={cn(
                "absolute left-[3px] top-[6px] size-[7px] -translate-x-1/2 rounded-full ring-4 ring-background",
                active
                  ? "animate-pulse bg-primary"
                  : "bg-muted-foreground/30"
              )}
            />

            {/* thought */}
            <p
              className={cn(
                "text-xs leading-relaxed",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.description}
            </p>

            {/* subtle meta */}
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground/70">
              <span className="font-mono">{toolLabel(step.tool)}</span>
              {step.status === "done" &&
                (step.resultLabel || step.rowCount != null) && (
                  <span className="tabular-nums">
                    {step.resultLabel ?? `${step.rowCount!.toLocaleString()} rows`}
                  </span>
                )}
              {step.status === "done" && step.durationMs != null && (
                <span className="tabular-nums">
                  {(step.durationMs / 1000).toFixed(1)}s
                </span>
              )}
              {active && step.startedAt != null && (
                <LiveStepTimer startedAt={step.startedAt} />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default AgentStepTracker;
