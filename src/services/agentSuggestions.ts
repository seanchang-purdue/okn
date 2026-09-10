import { getWsUrl } from "../config/ws";
import { CITIES } from "../config/cities";

export function catalogCityKey(city: unknown): string {
  const label = typeof city === "string" ? city.trim().toLowerCase() : "";
  const configured = CITIES.find((entry) =>
    [entry.key, entry.sourceCity, entry.name, ...entry.aliases].some(
      (name) => name.toLowerCase() === label,
    ),
  );
  // Keep unknown scopes explicit; clearing one would request all cities.
  return configured?.sourceCity ?? label;
}

export type ExplorationSuggestion = { label: string; query: string };
export type AgentSuggestionsState = {
  scope: string;
  status: "loading" | "ready" | "unavailable";
  suggestions: ExplorationSuggestion[];
};

export const agentSuggestionsUrl = (city: string) => {
  // Chat and map/data services may use different origins. This is an HTTP view
  // of the selected agent's WebSocket endpoint, including its configured prefix.
  const url = new URL(getWsUrl("AGENT"));
  if (url.protocol === "wss:") url.protocol = "https:";
  else if (url.protocol === "ws:") url.protocol = "http:";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/suggestions`;
  if (city) url.searchParams.set("city", catalogCityKey(city));
  return url.toString();
};

/** One request lifetime. Disposal also ignores replies from fetches that cannot
 * actually be aborted (including a JSON body already being decoded). */
export function subscribeAgentSuggestions(
  city: string,
  onChange: (state: AgentSuggestionsState) => void,
  fetcher: typeof fetch = fetch,
): () => void {
  const controller = new AbortController();
  let active = true;
  const unavailable = () =>
    onChange({ scope: city, status: "unavailable", suggestions: [] });
  onChange({ scope: city, status: "loading", suggestions: [] });
  const timeout = setTimeout(() => {
    if (!active) return;
    active = false;
    controller.abort();
    unavailable();
  }, 20_000);

  void (async () => {
    try {
      const response = await fetcher(agentSuggestionsUrl(city), {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Catalog unavailable");
      const payload: unknown = await response.json();
      if (!active) return;
      if (!payload || typeof payload !== "object")
        throw new Error("Invalid catalog");
      const result = payload as Record<string, unknown>;
      if (
        result.available !== true ||
        !Array.isArray(result.suggestions) ||
        !result.suggestions.length
      ) {
        unavailable();
        return;
      }
      const suggestions: ExplorationSuggestion[] = [];
      for (const entry of result.suggestions) {
        if (
          !entry ||
          typeof entry.label !== "string" ||
          !entry.label.trim() ||
          typeof entry.query !== "string" ||
          !entry.query.trim()
        ) {
          throw new Error("Invalid catalog suggestion");
        }
        suggestions.push({ label: entry.label, query: entry.query });
      }
      onChange({
        scope: city,
        status: "ready",
        suggestions: suggestions.slice(0, 3),
      });
    } catch {
      if (active) unavailable();
    } finally {
      clearTimeout(timeout);
    }
  })();

  return () => {
    active = false;
    clearTimeout(timeout);
    controller.abort();
  };
}
