// src/__tests__/statusStages.test.ts
// Smoke tests — Scenarios 1, 3, 7
// (status text mapping, phase bucketing, unknown-stage fallthrough)
//
// NOTE: StatusIndicator.tsx has "use client" and React imports but the two
// exported functions we test here are pure — no DOM or hooks involved.

import { describe, it, expect } from "vitest";
import { getStageInfo, getCurrentPhaseIndex } from "../components/status/StatusIndicator";
import type { StatusStage } from "../types/chat";

// ---------------------------------------------------------------------------
// getStageInfo — human-readable label for each stage (Scenario 7)
// ---------------------------------------------------------------------------

describe("getStageInfo", () => {
  it("returns a non-empty text for every defined StatusStage", () => {
    const allStages: StatusStage[] = [
      "needs_clarification",
      "request_accepted",
      "route_selected",
      "plan_started",
      "plan_ready",
      "tool_started",
      "tool_completed",
      "validation_failed",
      "synthesis_started",
      "classifying_query",
      "planning_queries",
      "generating_sql",
      "validating_sql",
      "executing_query",
      "retrying_query",
      "searching_alternatives",
      "processing_results",
      "interpreting_data",
      "synthesizing",
      "agent_thinking",
      "agent_tool_call",
      "agent_tool_result",
      "agent_synthesizing",
      "generating_response",
      "streaming_response",
      "generating_chart",
      "generating_map",
      "complete",
    ];

    for (const stage of allStages) {
      const { text } = getStageInfo(stage);
      expect(text.length, `stage "${stage}" has empty text`).toBeGreaterThan(0);
    }
  });

  // Scenario 3: needs_clarification shows the right user-facing text
  it("maps needs_clarification to 'Need more information'", () => {
    expect(getStageInfo("needs_clarification").text).toBe("Need more information");
  });

  // Scenario 7: unknown stage falls through gracefully, not a crash
  it("falls back to 'Processing' for an unrecognised stage string", () => {
    const { text } = getStageInfo("totally_unknown_stage" as StatusStage);
    expect(text).toBe("Processing");
  });

  // Scenario 1: simple query stages map correctly
  it("maps simple query stages to descriptive text", () => {
    expect(getStageInfo("classifying_query").text).toBe("Understanding your question");
    expect(getStageInfo("executing_query").text).toBe("Fetching data");
    expect(getStageInfo("streaming_response").text).toBe("Writing response");
  });

  // Scenario 2: agent stages have descriptive text
  it("maps all four agent stages to descriptive text", () => {
    expect(getStageInfo("agent_thinking").text).toBe("Analyzing your question");
    expect(getStageInfo("agent_tool_call").text).toBe("Running analysis tool");
    expect(getStageInfo("agent_tool_result").text).toBe("Processing tool results");
    expect(getStageInfo("agent_synthesizing").text).toBe("Synthesizing answer");
  });
});

// ---------------------------------------------------------------------------
// getCurrentPhaseIndex — phase-dot position (Scenarios 1, 2, 3)
// ---------------------------------------------------------------------------

describe("getCurrentPhaseIndex", () => {
  it("places needs_clarification in the Planning phase (index 1)", () => {
    expect(getCurrentPhaseIndex("needs_clarification")).toBe(1);
  });

  it("places agent_thinking in the Planning phase (index 1)", () => {
    expect(getCurrentPhaseIndex("agent_thinking")).toBe(1);
  });

  it("places agent_tool_call and agent_tool_result in the Querying phase (index 2)", () => {
    expect(getCurrentPhaseIndex("agent_tool_call")).toBe(2);
    expect(getCurrentPhaseIndex("agent_tool_result")).toBe(2);
  });

  it("places agent_synthesizing in the Analyzing phase (index 3)", () => {
    expect(getCurrentPhaseIndex("agent_synthesizing")).toBe(3);
  });

  // Scenario 1: simple query phase progression
  it("orders simple query phases correctly", () => {
    const routing = getCurrentPhaseIndex("request_accepted");
    const planning = getCurrentPhaseIndex("classifying_query");
    const querying = getCurrentPhaseIndex("executing_query");
    const analyzing = getCurrentPhaseIndex("processing_results");
    const responding = getCurrentPhaseIndex("streaming_response");
    expect(routing).toBeLessThan(planning);
    expect(planning).toBeLessThan(querying);
    expect(querying).toBeLessThan(analyzing);
    expect(analyzing).toBeLessThan(responding);
  });
});
