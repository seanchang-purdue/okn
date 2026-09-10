import { afterEach, describe, expect, it, vi } from "vitest";
import { getWsUrl } from "../config/ws";
import {
  agentSuggestionsUrl,
  catalogCityKey,
  subscribeAgentSuggestions,
  type AgentSuggestionsState,
} from "../services/agentSuggestions";

const response = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const available = (city: string) => ({
  available: true,
  suggestions: [
    { label: `Explore ${city}`, query: `Rank available tracts in ${city}.` },
  ],
});
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("agent catalog suggestions", () => {
  it("uses the mounted backend routes when no URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CHATBOT_URL", "");
    expect(getWsUrl("AGENT")).toBe("ws://localhost:8000/api/v1/ws/agent");
    expect(agentSuggestionsUrl("")).toBe(
      "http://localhost:8000/api/v1/ws/agent/suggestions",
    );
    expect(getWsUrl("CHAT")).toBe("ws://localhost:8000/api/v1/ws/chat");
  });
  it("uses the agent websocket origin and route prefix, not the map server", () => {
    vi.stubEnv("NEXT_PUBLIC_CHATBOT_URL", "wss://analyst.example/api/v1/ws/");
    vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "https://map.example/api/v1");
    expect(agentSuggestionsUrl("new york")).toBe(
      "https://analyst.example/api/v1/ws/agent/suggestions?city=nyc",
    );
  });

  it.each(["New York", "New York City", " nyc ", "Brooklyn"])(
    "maps displayed city %s to the actual catalog source key",
    (label) => expect(catalogCityKey(label)).toBe("nyc"),
  );

  it("preserves an unknown geography instead of requesting unrelated city coverage", () => {
    expect(catalogCityKey(" Philadelphia ")).toBe("philadelphia");
    expect(catalogCityKey("Census tract 123")).toBe("census tract 123");
    expect(catalogCityKey(undefined)).toBe("");
  });

  it("ignores an old city's late decoded response after the selection changes", async () => {
    const firstBody = deferred<unknown>();
    const secondResponse = deferred<Response>();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => firstBody.promise })
      .mockReturnValueOnce(secondResponse.promise);
    const states: AgentSuggestionsState[] = [];
    const disposeFirst = subscribeAgentSuggestions(
      "philadelphia",
      (state) => states.push(state),
      fetcher,
    );
    await settle();
    disposeFirst();
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    const disposeSecond = subscribeAgentSuggestions(
      "chicago",
      (state) => states.push(state),
      fetcher,
    );
    secondResponse.resolve(response(available("Chicago")));
    await settle();
    firstBody.resolve(available("Philadelphia"));
    await settle();
    expect(states.at(-1)?.scope).toBe("chicago");
    expect(states.at(-1)?.suggestions[0].label).toBe("Explore Chicago");
    expect(
      states.some(
        (state) => state.status === "ready" && state.scope === "philadelphia",
      ),
    ).toBe(false);
    disposeSecond();
  });

  it("does not publish a response after switching away from agent mode", async () => {
    const pending = deferred<Response>();
    const publish = vi.fn();
    const dispose = subscribeAgentSuggestions(
      "",
      publish,
      vi.fn(() => pending.promise),
    );
    dispose();
    pending.resolve(response(available("loaded metrics")));
    await settle();
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish.mock.calls[0][0].status).toBe("loading");
  });

  it.each([
    {
      available: false,
      suggestions: [
        { label: "Hidden resources", query: "Invent resource density" },
      ],
    },
    { available: true, suggestions: [] },
    { available: true, suggestions: [{ label: "Malformed", query: 12 }] },
  ])(
    "never invents fallback prompts for empty, hidden, or malformed catalogs",
    async (payload) => {
      const states: AgentSuggestionsState[] = [];
      const dispose = subscribeAgentSuggestions(
        "",
        (state) => states.push(state),
        vi.fn(async () => response(payload)),
      );
      await settle();
      expect(states.at(-1)).toEqual({
        scope: "",
        status: "unavailable",
        suggestions: [],
      });
      dispose();
    },
  );

  it("clears old suggestions on a failed refresh instead of offering stale coverage", async () => {
    const states: AgentSuggestionsState[] = [];
    const publish = (state: AgentSuggestionsState) => states.push(state);
    const first = subscribeAgentSuggestions(
      "",
      publish,
      vi.fn(async () => response(available("loaded metrics"))),
    );
    await settle();
    expect(states.at(-1)?.status).toBe("ready");
    first();
    const second = subscribeAgentSuggestions(
      "",
      publish,
      vi.fn(async () => response({}, 503)),
    );
    expect(states.at(-1)?.suggestions).toEqual([]);
    await settle();
    expect(states.at(-1)?.status).toBe("unavailable");
    expect(states.at(-1)?.suggestions).toEqual([]);
    second();
  });

  it("times out and ignores a later successful response", async () => {
    vi.useFakeTimers();
    const pending = deferred<Response>();
    const publish = vi.fn();
    const fetcher = vi.fn(() => pending.promise);
    const dispose = subscribeAgentSuggestions("", publish, fetcher);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(publish.mock.lastCall?.[0].status).toBe("unavailable");
    const calls = publish.mock.calls.length;
    pending.resolve(response(available("late metrics")));
    await vi.runAllTimersAsync();
    expect(publish).toHaveBeenCalledTimes(calls);
    dispose();
  });
});
