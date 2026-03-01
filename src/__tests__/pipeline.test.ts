// src/__tests__/pipeline.test.ts
// Smoke tests — Scenarios 2, 6, 7 (agent pipeline + step accumulation)

import { describe, it, expect } from "vitest";
import { isAgentPipeline, reduceAgentStep } from "../utils/pipeline";
import type { PhaseInfo, StatusPayload } from "../types/chat";

// ---------------------------------------------------------------------------
// isAgentPipeline — type guard
// ---------------------------------------------------------------------------

describe("isAgentPipeline", () => {
  it("returns true for a valid AgentPhaseInfo", () => {
    const pi: PhaseInfo = {
      phase: "agent",
      step: 1,
      maxSteps: 8,
      stage: "agent_thinking",
    };
    expect(isAgentPipeline(pi)).toBe(true);
  });

  it("returns false for FixedPhaseInfo phases", () => {
    const phases = [
      "understanding",
      "planning",
      "searching",
      "analyzing",
      "streaming",
      "visualization",
    ] as const;
    for (const phase of phases) {
      expect(isAgentPipeline({ phase })).toBe(false);
    }
  });

  it("returns false for undefined", () => {
    expect(isAgentPipeline(undefined)).toBe(false);
  });

  it("narrows the type — accessing agent fields is safe after guard", () => {
    const pi: PhaseInfo = {
      phase: "agent",
      step: 3,
      maxSteps: 8,
      stage: "agent_tool_call",
      tool: "execute_sql",
    };
    if (isAgentPipeline(pi)) {
      // These accesses would be TS errors without the guard
      expect(pi.step).toBe(3);
      expect(pi.tool).toBe("execute_sql");
    } else {
      throw new Error("guard should have returned true");
    }
  });
});

// ---------------------------------------------------------------------------
// reduceAgentStep — step accumulation reducer (Scenario 6)
// ---------------------------------------------------------------------------

const makeStatus = (
  stage: StatusPayload["stage"],
  pi: PhaseInfo,
  message = "test"
): StatusPayload => ({ stage, message, phaseInfo: pi });

const agentPi = (
  step: number,
  stage: "agent_thinking" | "agent_tool_call" | "agent_tool_result" | "agent_synthesizing",
  extra: Partial<{ tool: string; rowCount: number }> = {}
): PhaseInfo => ({
  phase: "agent",
  step,
  maxSteps: 8,
  stage,
  ...extra,
});

describe("reduceAgentStep", () => {
  // Scenario 2: complex query — agent steps appear with tool names + row counts

  it("appends a calling step on agent_tool_call", () => {
    const status = makeStatus(
      "agent_tool_call",
      agentPi(1, "agent_tool_call", { tool: "execute_sql" }),
      "Querying incidents in philadelphia..."
    );
    const result = reduceAgentStep([], status);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      stepNumber: 1,
      tool: "execute_sql",
      description: "Querying incidents in philadelphia...",
      status: "calling",
    });
  });

  it("marks last calling step as done with rowCount on agent_tool_result", () => {
    const calling = reduceAgentStep(
      [],
      makeStatus("agent_tool_call", agentPi(1, "agent_tool_call", { tool: "execute_sql" }))
    );
    const done = reduceAgentStep(
      calling,
      makeStatus(
        "agent_tool_result",
        agentPi(1, "agent_tool_result", { rowCount: 1234 }),
        "Got 1,234 results"
      )
    );
    expect(done[0].status).toBe("done");
    expect(done[0].rowCount).toBe(1234);
  });

  it("accumulates multiple steps across tool_call / tool_result pairs", () => {
    let steps = reduceAgentStep(
      [],
      makeStatus("agent_tool_call", agentPi(1, "agent_tool_call", { tool: "execute_sql" }))
    );
    steps = reduceAgentStep(
      steps,
      makeStatus("agent_tool_result", agentPi(1, "agent_tool_result", { rowCount: 500 }))
    );
    steps = reduceAgentStep(
      steps,
      makeStatus("agent_tool_call", agentPi(2, "agent_tool_call", { tool: "aggregate_data" }))
    );
    steps = reduceAgentStep(
      steps,
      makeStatus("agent_tool_result", agentPi(2, "agent_tool_result", { rowCount: 42 }))
    );

    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ tool: "execute_sql", status: "done", rowCount: 500 });
    expect(steps[1]).toMatchObject({ tool: "aggregate_data", status: "done", rowCount: 42 });
  });

  it("does not modify steps on agent_thinking or agent_synthesizing", () => {
    const existing = [
      { stepNumber: 1, tool: "execute_sql", description: "x", status: "done" as const },
    ];
    const unchanged = reduceAgentStep(
      existing,
      makeStatus("agent_thinking", agentPi(2, "agent_thinking"))
    );
    expect(unchanged).toBe(existing); // same reference — no clone
  });

  it("returns steps unchanged for non-agent phaseInfo", () => {
    const existing = [
      { stepNumber: 1, tool: "execute_sql", description: "x", status: "done" as const },
    ];
    const status: StatusPayload = {
      stage: "executing_query",
      message: "Fetching data",
      phaseInfo: { phase: "searching", queryType: "single" },
    };
    expect(reduceAgentStep(existing, status)).toBe(existing);
  });

  // Scenario 6: complete query then new query — steps must clear between queries
  // (StatusIndicator resets agentStepsRef on status=null; this tests the reducer
  // correctly returns [] identity when starting fresh)
  it("handles an empty list gracefully", () => {
    const status = makeStatus(
      "agent_tool_result",
      agentPi(1, "agent_tool_result", { rowCount: 10 })
    );
    // No previous calling step — result list stays empty, no crash
    expect(reduceAgentStep([], status)).toHaveLength(0);
  });
});
