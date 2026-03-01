// src/utils/pipeline.ts
import type { PhaseInfo, AgentPhaseInfo, StatusPayload } from "../types/chat";
import type { AgentStep } from "../components/status/AgentStepTracker";

/**
 * Type guard: narrows PhaseInfo to AgentPhaseInfo when phase === "agent".
 *
 * Use this instead of a manual `phaseInfo?.phase === "agent"` check so that
 * TypeScript automatically knows the full AgentPhaseInfo shape (step, maxSteps,
 * tool, args, rowCount, preview) is available inside the branch — no casts needed.
 *
 * @example
 * if (isAgentPipeline(status.phaseInfo)) {
 *   console.log(status.phaseInfo.step);  // TS knows this is number
 * }
 */
export function isAgentPipeline(
  phaseInfo: PhaseInfo | undefined
): phaseInfo is AgentPhaseInfo {
  return phaseInfo?.phase === "agent";
}

/**
 * Extract a human-readable result string from agent tool results.
 * Handles the scratchpad `dataset_id` format where `rowCount` is null
 * and the row count lives inside the `preview` JSON blob.
 */
export function formatToolPreview(
  rowCount: number | undefined,
  preview: string | undefined
): string | undefined {
  if (rowCount != null) return `${rowCount.toLocaleString()} rows`;
  if (!preview) return undefined;
  try {
    const summary = JSON.parse(preview);
    if (summary.row_count != null)
      return `${Number(summary.row_count).toLocaleString()} rows`;
    if (summary.feature_count != null)
      return `${Number(summary.feature_count).toLocaleString()} features`;
    if (summary.chart_generated) return `Chart: ${summary.title ?? "created"}`;
    if (summary.artifact_created) return `${summary.title ?? "created"}`;
  } catch {
    /* not JSON, ignore */
  }
  return undefined;
}

/**
 * Pure reducer for the agent step list shown in AgentStepTracker.
 *
 * - `agent_tool_call`   → append a new "calling" step
 * - `agent_tool_result` → mark the last "calling" step as "done" + attach rowCount
 * - any other stage     → return steps unchanged
 *
 * Extracted from StatusIndicator's useEffect so it can be unit-tested without
 * mounting any React component.
 */
export function reduceAgentStep(
  steps: AgentStep[],
  status: StatusPayload
): AgentStep[] {
  if (!isAgentPipeline(status.phaseInfo)) return steps;

  const pi = status.phaseInfo;

  if (status.stage === "agent_tool_call" && pi.tool) {
    return [
      ...steps,
      {
        stepNumber: pi.step,
        tool: pi.tool,
        description: status.message,
        status: "calling",
        startedAt: Date.now(),
      },
    ];
  }

  if (status.stage === "agent_tool_result") {
    const next = [...steps];
    const last = next[next.length - 1];
    if (last?.status === "calling") {
      const formatted = formatToolPreview(pi.rowCount, pi.preview);
      next[next.length - 1] = {
        ...last,
        status: "done",
        rowCount: pi.rowCount,
        resultLabel: formatted,
        durationMs: last.startedAt ? Date.now() - last.startedAt : undefined,
      };
    }
    return next;
  }

  return steps;
}
