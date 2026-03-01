import type { GeographyResult } from "../../hooks/useGeographySearch";

interface GeographyResultsProps {
  results: GeographyResult[];
  loading: boolean;
  error: string;
  query: string;
  onSelect: (result: GeographyResult) => void;
}

const typeLabel = (type: string) => {
  switch (type) {
    case "address":
      return "Address";
    case "place":
      return "City";
    case "district":
      return "District";
    case "neighborhood":
      return "Neighborhood";
    case "poi":
      return "POI";
    case "region":
      return "Region";
    default:
      return type || "Location";
  }
};

const GeographyResults = ({
  results,
  loading,
  error,
  query,
  onSelect,
}: GeographyResultsProps) => {
  if (!query.trim()) return null;

  return (
    <div className="mt-1.5 max-h-64 overflow-auto rounded-xl border border-[var(--chat-border)] bg-[color:var(--chat-panel-strong)]">
      {loading && (
        <div className="px-3 py-2.5 text-xs text-[var(--chat-muted)]">Searching...</div>
      )}

      {!loading && error && (
        <div className="px-3 py-2.5 text-xs text-rose-600 dark:text-rose-400">{error}</div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="px-3 py-2.5 text-xs text-[var(--chat-muted)]">No locations found.</div>
      )}

      {!loading &&
        !error &&
        results.map((result) => (
          <button
            key={result.id}
            onClick={() => onSelect(result)}
            className="flex w-full items-start justify-between gap-2 border-b border-[var(--chat-border)]/60 px-3 py-2 text-left last:border-b-0 hover:bg-[var(--chat-accent-soft)]/45"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[var(--chat-title)] dark:text-slate-100">
                {result.label}
              </p>
              <p className="truncate text-[11px] text-[var(--chat-muted)]">{result.fullName}</p>
            </div>
            <span className="rounded-full border border-[var(--chat-border)] px-2 py-0.5 text-[9px] uppercase tracking-[0.05em] text-[var(--chat-muted)]">
              {typeLabel(result.primaryType)}
            </span>
          </button>
        ))}
    </div>
  );
};

export default GeographyResults;
