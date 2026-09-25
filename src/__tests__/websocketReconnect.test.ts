// Connection lifecycle of WebSocketManager and the websocketStore singleton:
// intentional closes stay silent, unexpected closes reconnect with a capped
// backoff, and a close in the middle of a request ends that request through
// the normal error path instead of leaving the UI spinning.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type CloseEventLike = { code: number; reason: string; wasClean: boolean };

/**
 * Browser-faithful stand-in for WebSocket. Server-side events are driven by
 * the test; client-side close() follows the browser rules: closing an open
 * socket fires only "close", closing a socket that is still connecting fails
 * the connection and fires "error" then "close", both asynchronously.
 */
class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  onopen: ((event: unknown) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onclose: ((event: CloseEventLike) => void) | null = null;
  sent: string[] = [];

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string) {
    if (this.readyState === FakeWebSocket.CONNECTING) {
      throw new Error("InvalidStateError: still in CONNECTING state");
    }
    if (this.readyState === FakeWebSocket.OPEN) this.sent.push(data);
  }

  close(code = 1000) {
    if (this.readyState === FakeWebSocket.CONNECTING) {
      this.readyState = FakeWebSocket.CLOSING;
      setTimeout(() => this.abort(), 0);
      return;
    }
    if (this.readyState !== FakeWebSocket.OPEN) return;
    this.readyState = FakeWebSocket.CLOSING;
    setTimeout(() => this.finishClose(code, true), 0);
  }

  // --- server / network side -------------------------------------------
  serverOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.({ type: "open" });
  }

  serverSend(frame: unknown) {
    this.onmessage?.({ data: JSON.stringify(frame) });
  }

  /** Server closes with a close frame, e.g. 1001 on a restart. */
  serverClose(code = 1001) {
    this.finishClose(code, true);
  }

  /** Connection dies without a close frame: ALB idle timeout, killed server. */
  abort() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onerror?.({ type: "error" });
    this.onclose?.({ code: 1006, reason: "", wasClean: false });
  }

  private finishClose(code: number, wasClean: boolean) {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code, reason: "", wasClean });
  }
}

const latestSocket = () => {
  const socket = FakeWebSocket.instances.at(-1);
  if (!socket) throw new Error("no WebSocket was created");
  return socket;
};

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeWebSocket);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("WebSocketManager connection lifecycle", () => {
  const setup = async (pending = false) => {
    const { WebSocketManager } = await import("../utils/websocket");
    const onMessage = vi.fn();
    const onConnectionChange = vi.fn();
    const onError = vi.fn();
    const state = { pending };
    const manager = new WebSocketManager(
      "ws://test/chat",
      onMessage,
      onConnectionChange,
      onError,
      undefined,
      undefined,
      undefined,
      undefined,
      { hasPendingRequest: () => state.pending }
    );
    manager.connect();
    return { manager, onConnectionChange, onError, state };
  };

  it("stays silent when disconnect() closes an open socket", async () => {
    const { manager, onConnectionChange, onError } = await setup();
    latestSocket().serverOpen();

    manager.disconnect();
    await vi.runAllTimersAsync();

    expect(onError).not.toHaveBeenCalled();
    expect(onConnectionChange).toHaveBeenLastCalledWith(false);
    expect(manager.isConnected).toBe(false);
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("stays silent when close() is called while still connecting", async () => {
    const { manager, onError } = await setup();

    manager.close();
    await vi.runAllTimersAsync();

    expect(onError).not.toHaveBeenCalled();
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("does not reconnect after close() on an open socket", async () => {
    const { manager, onError } = await setup();
    latestSocket().serverOpen();

    manager.close();
    await vi.runAllTimersAsync();

    expect(onError).not.toHaveBeenCalled();
    expect(manager.isConnected).toBe(false);
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("reconnects silently after an idle connection is dropped", async () => {
    const { manager, onConnectionChange, onError } = await setup();
    latestSocket().serverOpen();

    latestSocket().abort();
    expect(onError).not.toHaveBeenCalled();
    expect(onConnectionChange).toHaveBeenLastCalledWith(false);
    expect(manager.isConnected).toBe(false);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(FakeWebSocket.instances).toHaveLength(2);

    latestSocket().serverOpen();
    expect(onConnectionChange).toHaveBeenLastCalledWith(true);
    expect(manager.isConnected).toBe(true);
    expect(onError).not.toHaveBeenCalled();
  });

  it("reconnects after the server closes cleanly (restart)", async () => {
    const { manager, onError } = await setup();
    latestSocket().serverOpen();

    latestSocket().serverClose(1001);
    await vi.advanceTimersByTimeAsync(1_000);
    latestSocket().serverOpen();

    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(manager.isConnected).toBe(true);
    expect(onError).not.toHaveBeenCalled();
  });

  it("backs off exponentially up to a cap and resets after a successful open", async () => {
    const { onError } = await setup();
    latestSocket().serverOpen();
    latestSocket().abort();

    // Server stays down: every attempt fails before opening.
    const expectedDelays = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000];
    for (const delay of expectedDelays) {
      const before = FakeWebSocket.instances.length;
      await vi.advanceTimersByTimeAsync(delay - 1);
      expect(FakeWebSocket.instances).toHaveLength(before);
      await vi.advanceTimersByTimeAsync(1);
      expect(FakeWebSocket.instances).toHaveLength(before + 1);
      latestSocket().abort();
    }

    // Server comes back: the next attempt opens and the backoff starts over.
    await vi.advanceTimersByTimeAsync(30_000);
    latestSocket().serverOpen();
    latestSocket().abort();
    const before = FakeWebSocket.instances.length;
    await vi.advanceTimersByTimeAsync(1_000);
    expect(FakeWebSocket.instances).toHaveLength(before + 1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("disconnect() cancels a pending reconnect", async () => {
    const { manager } = await setup();
    latestSocket().serverOpen();
    latestSocket().abort();

    manager.disconnect();
    await vi.runAllTimersAsync();

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(manager.isConnected).toBe(false);
  });

  it.each([
    ["a clean server close", (socket: FakeWebSocket) => socket.serverClose(1001)],
    ["a dropped connection", (socket: FakeWebSocket) => socket.abort()],
  ])("ends a pending request through onError on %s", async (_label, closeSocket) => {
    const { manager, onError, state } = await setup(true);
    latestSocket().serverOpen();

    closeSocket(latestSocket());

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toMatch(/connection/i);
    expect(onError.mock.calls[0][2]).toBe(true);

    state.pending = false;
    await vi.advanceTimersByTimeAsync(1_000);
    latestSocket().serverOpen();
    expect(manager.isConnected).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("websocketStore across connection loss", () => {
  const setupStore = async () => {
    // The store only connects in the browser.
    vi.stubGlobal("window", new EventTarget());
    const store = await import("../stores/websocketStore");
    const { insightState } = await import("../stores/insightStore");
    latestSocket().serverOpen();
    expect(store.wsState.get().isConnected).toBe(true);
    return { ...store, insightState };
  };

  const sentChatContents = (socket: FakeWebSocket) =>
    socket.sent
      .map((raw) => JSON.parse(raw) as { type: string; content?: string })
      .filter((payload) => payload.type === "chat")
      .map((payload) => payload.content);

  // Next renders client components on the server too, and Node 22+ has a
  // global WebSocket: connecting at import time opened a socket from the
  // Next server process, which would now also reconnect forever.
  it("does not connect when imported on the server", async () => {
    const { wsState } = await import("../stores/websocketStore");
    await vi.runAllTimersAsync();

    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(wsState.get().isConnected).toBe(false);
  });

  it("ends an in-flight request when the server closes, then reconnects", async () => {
    const { wsState, wsActions, insightState } = await setupStore();
    wsActions.sendMessage("How many shootings in 2023?");
    expect(wsState.get().loading).toBe(true);

    latestSocket().serverClose(1001);

    expect(wsState.get()).toMatchObject({
      loading: false,
      mapLoading: false,
      currentStatus: null,
      isConnected: false,
      retryable: true,
    });
    expect(wsState.get().error).toMatch(/connection/i);
    expect(insightState.get().loading).toBe(false);

    await vi.advanceTimersByTimeAsync(1_000);
    latestSocket().serverOpen();
    expect(wsState.get().isConnected).toBe(true);
  });

  it("leaves no stale error after an idle drop and sends on the new socket", async () => {
    const { wsState, wsActions } = await setupStore();

    latestSocket().abort();
    expect(wsState.get().error).toBe("");
    expect(wsState.get().isConnected).toBe(false);

    await vi.advanceTimersByTimeAsync(1_000);
    latestSocket().serverOpen();
    expect(wsState.get().isConnected).toBe(true);

    wsActions.sendMessage("Compare Chicago and Philadelphia");
    expect(sentChatContents(latestSocket())).toEqual([
      "Compare Chicago and Philadelphia",
    ]);
    expect(wsState.get().error).toBe("");
  });

  // ChatBox renders the error banner in place of the status indicator, so a
  // leftover error hides the progress of the next request.
  it("clears the previous request's error when a new request starts", async () => {
    const { wsState, wsActions } = await setupStore();
    wsActions.sendMessage("first question");
    latestSocket().serverSend({
      type: "error",
      payload: { code: "PROCESSING_ERROR", message: "Query failed", retryable: true },
    });
    expect(wsState.get().error).toBe("Query failed");

    wsActions.sendMessage("second question");

    expect(wsState.get()).toMatchObject({
      loading: true,
      error: "",
      errorCode: "",
      retryable: false,
    });
  });

  it("does not reconnect or report an error when the endpoint changes", async () => {
    const { wsState, wsActions } = await setupStore();
    wsActions.changeEndpoint("AGENT");
    latestSocket().serverOpen();
    await vi.runAllTimersAsync();

    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(wsState.get()).toMatchObject({ isConnected: true, error: "" });
  });

  // The backend is dropping the "complete" status it used to send after an
  // error frame; the error frame alone has to end the request.
  it.each([
    [
      "an error frame",
      {
        type: "error",
        payload: {
          code: "PROCESSING_ERROR",
          message: "Query failed",
          retryable: true,
        },
      },
    ],
    [
      "an agent response.error event",
      {
        type: "event",
        payload: {
          type: "response.error",
          data: { code: "PROCESSING_ERROR", message: "Query failed" },
        },
      },
    ],
  ])("treats %s as the end of the request without a complete status", async (_label, frame) => {
    const { wsState, wsActions, insightState } = await setupStore();
    wsActions.sendMessage("How many shootings in 2023?");
    latestSocket().serverSend({
      type: "status",
      payload: { stage: "planning_queries", message: "Planning", progress: 20 },
    });
    expect(wsState.get().currentStatus?.stage).toBe("planning_queries");

    latestSocket().serverSend(frame);

    expect(wsState.get()).toMatchObject({
      loading: false,
      mapLoading: false,
      currentStatus: null,
      error: "Query failed",
      errorCode: "PROCESSING_ERROR",
      retryable: true,
      isConnected: true,
    });
    expect(insightState.get().loading).toBe(false);
    expect(insightState.get().blocks.every((block) => !block.streaming)).toBe(true);

    // Nothing left to time out or flip back into a loading state.
    await vi.runAllTimersAsync();
    expect(wsState.get().loading).toBe(false);
    expect(wsState.get().currentStatus).toBeNull();
  });
});
