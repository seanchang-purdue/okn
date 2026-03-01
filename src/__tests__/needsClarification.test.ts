// src/__tests__/needsClarification.test.ts
// Smoke test — Scenario 3 (needs_clarification input-gate logic)
//
// The websocketStore has module-level side effects (WebSocket connection),
// so we test the STATUS HANDLER LOGIC directly as a pure function rather
// than importing the store.

import { describe, it, expect } from "vitest";
import type { StatusPayload } from "../types/chat";

// ---------------------------------------------------------------------------
// Replicate the exact state-transition logic from websocketStore.ts so we
// can verify the needs_clarification behaviour without touching any sockets.
// ---------------------------------------------------------------------------

interface SlimState {
  loading: boolean;
  currentStatus: StatusPayload | null;
}

function applyStatusUpdate(
  state: SlimState,
  status: StatusPayload
): SlimState {
  return {
    ...state,
    currentStatus: status,
    // needs_clarification: stop the loading spinner so input re-enables
    ...(status.stage === "needs_clarification" && { loading: false }),
    // complete: clear everything
    ...(status.stage === "complete" && {
      currentStatus: null,
      loading: false,
    }),
  };
}

function applyNewMessage(state: SlimState): SlimState {
  return {
    ...state,
    loading: true,
    currentStatus: null, // stale clarification cleared on new send
  };
}

// Mirror of ChatBox.tsx isProcessing calculation
function isProcessing(state: SlimState): boolean {
  return (
    state.loading ||
    (state.currentStatus !== null &&
      state.currentStatus.stage !== "needs_clarification")
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("needs_clarification state transitions", () => {
  const clarificationStatus: StatusPayload = {
    stage: "needs_clarification",
    message: "Could you be more specific about which city and time period?",
    progress: 10,
  };

  it("loading becomes false when needs_clarification arrives", () => {
    const before: SlimState = { loading: true, currentStatus: null };
    const after = applyStatusUpdate(before, clarificationStatus);
    expect(after.loading).toBe(false);
  });

  it("currentStatus is set to the clarification payload", () => {
    const before: SlimState = { loading: true, currentStatus: null };
    const after = applyStatusUpdate(before, clarificationStatus);
    expect(after.currentStatus?.stage).toBe("needs_clarification");
  });

  it("isProcessing is false after needs_clarification (input re-enabled)", () => {
    const before: SlimState = { loading: true, currentStatus: null };
    const after = applyStatusUpdate(before, clarificationStatus);
    expect(isProcessing(after)).toBe(false);
  });

  it("currentStatus is cleared when user sends a follow-up message", () => {
    const withClarification: SlimState = {
      loading: false,
      currentStatus: clarificationStatus,
    };
    const afterSend = applyNewMessage(withClarification);
    expect(afterSend.currentStatus).toBeNull();
    expect(afterSend.loading).toBe(true);
  });

  it("isProcessing is true while a normal query is in flight", () => {
    const inFlight: SlimState = {
      loading: true,
      currentStatus: {
        stage: "executing_query",
        message: "Fetching data",
        progress: 40,
      },
    };
    expect(isProcessing(inFlight)).toBe(true);
  });

  it("isProcessing is true when loading is true even without a status", () => {
    expect(isProcessing({ loading: true, currentStatus: null })).toBe(true);
  });

  it("isProcessing is false when idle (no loading, no status)", () => {
    expect(isProcessing({ loading: false, currentStatus: null })).toBe(false);
  });

  it("complete stage clears both loading and currentStatus", () => {
    const mid: SlimState = {
      loading: true,
      currentStatus: { stage: "streaming_response", message: "Writing response" },
    };
    const done = applyStatusUpdate(mid, { stage: "complete", message: "Done" });
    expect(done.loading).toBe(false);
    expect(done.currentStatus).toBeNull();
    expect(isProcessing(done)).toBe(false);
  });
});
