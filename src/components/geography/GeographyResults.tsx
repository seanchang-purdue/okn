import { Badge } from "@/components/ui/badge";
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
    <div className="mt-1.5 max-h-64 overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
      {loading && (
        <div className="px-3 py-2.5 text-xs text-muted-foreground">Searching...</div>
      )}

      {!loading && error && (
        <div className="px-3 py-2.5 text-xs text-destructive">{error}</div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="px-3 py-2.5 text-xs text-muted-foreground">No locations found.</div>
      )}

      {!loading &&
        !error &&
        results.map((result) => (
          <button
            key={result.id}
            onClick={() => onSelect(result)}
            className="flex w-full items-start justify-between gap-2 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-accent hover:text-accent-foreground"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {result.label}
              </p>
              <p className="truncate text-xs text-muted-foreground">{result.fullName}</p>
            </div>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              {typeLabel(result.primaryType)}
            </Badge>
          </button>
        ))}
    </div>
  );
};

export default GeographyResults;
