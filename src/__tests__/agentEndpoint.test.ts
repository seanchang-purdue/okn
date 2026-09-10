import { afterEach, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());

it("switches a busy legacy connection to an idle analyst connection", async () => {
  class MockSocket {
    static OPEN = 1;
    static CONNECTING = 0;
    static instances: MockSocket[] = [];
    readyState = 1;
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onmessage: ((event: unknown) => void) | null = null;
    constructor(public url: string) {
      MockSocket.instances.push(this);
    }
    close() {
      this.readyState = 3;
    }
    send() {}
  }
  vi.stubGlobal("WebSocket", MockSocket);
  const { wsState, wsActions } = await import("../stores/websocketStore");
  expect(wsState.get().currentEndpoint).toBe("CHAT");
  wsState.set({
    ...wsState.get(),
    loading: true,
    retryable: true,
    error: "Previous endpoint failed",
    currentStatus: {
      stage: "planning_queries",
      message: "Old analysis",
      progress: 10,
    },
  });
  wsActions.changeEndpoint("AGENT");
  MockSocket.instances.at(-1)?.onopen?.();
  expect(wsState.get()).toMatchObject({
    currentEndpoint: "AGENT",
    isConnected: true,
    loading: false,
    currentStatus: null,
    retryable: false,
    error: "",
    errorCode: "",
  });
});
