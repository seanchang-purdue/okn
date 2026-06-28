import { useState, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GeographyResults from "./GeographyResults";
import type { GeographyResult } from "../../hooks/useGeographySearch";

interface GeographySearchInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: GeographyResult[];
  loading: boolean;
  error: string;
  onSelect: (result: GeographyResult) => void;
  onClear: () => void;
}

const GeographySearchInput = ({
  query,
  onQueryChange,
  results,
  loading,
  error,
  onSelect,
  onClear,
}: GeographySearchInputProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" && results.length > 0) {
      onSelect(results[0]);
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />

        <Input
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search address, county, district, POI"
          className="pl-8 pr-8 text-sm"
        />

        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label="Clear geography search"
          >
            <X />
          </Button>
        )}
      </div>

      {isOpen && (
        <GeographyResults
          results={results}
          loading={loading}
          error={error}
          query={query}
          onSelect={(result) => {
            onSelect(result);
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default GeographySearchInput;
