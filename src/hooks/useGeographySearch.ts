import { useEffect, useMemo, useRef, useState } from "react";

export interface GeographyResult {
  id: string;
  label: string;
  fullName: string;
  center: [number, number];
  bbox?: [number, number, number, number];
  placeType: string[];
  primaryType: string;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text?: string;
  center?: [number, number];
  bbox?: [number, number, number, number];
  place_type?: string[];
}

interface MapboxGeocodingResponse {
  features?: MapboxFeature[];
}

interface UseGeographySearchResult {
  query: string;
  setQuery: (value: string) => void;
  results: GeographyResult[];
  loading: boolean;
  error: string;
  clear: () => void;
}

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 280;

const normalizeFeature = (feature: MapboxFeature): GeographyResult | null => {
  if (!feature.center || feature.center.length !== 2) return null;

  const placeType = feature.place_type || [];

  return {
    id: feature.id,
    label: feature.text || feature.place_name,
    fullName: feature.place_name,
    center: feature.center,
    bbox: feature.bbox,
    placeType,
    primaryType: placeType[0] || "unknown",
  };
};

const useGeographySearch = (): UseGeographySearchResult => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeographyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const accessToken = useMemo(
    () => process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
    []
  );

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setLoading(false);
      setError("");
      setResults([]);
      return;
    }

    if (!accessToken) {
      setError("Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN");
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError("");

      try {
        const url = new URL(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            trimmedQuery
          )}.json`
        );

        url.searchParams.set("autocomplete", "true");
        url.searchParams.set("limit", "8");
        url.searchParams.set("country", "us");
        url.searchParams.set(
          "types",
          "address,place,locality,neighborhood,district,region,postcode,poi"
        );
        url.searchParams.set("access_token", accessToken);

        const resp = await fetch(url.toString(), {
          signal: controller.signal,
        });

        if (!resp.ok) {
          throw new Error(`Geocoding request failed (${resp.status})`);
        }

        const json = (await resp.json()) as MapboxGeocodingResponse;
        const nextResults = (json.features || [])
          .map(normalizeFeature)
          .filter((item): item is GeographyResult => item !== null);

        setResults(nextResults);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setResults([]);
        setError((err as Error).message || "Failed to search geography");
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [accessToken, query]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clear: () => {
      setQuery("");
      setResults([]);
      setError("");
      setLoading(false);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    },
  };
};

export default useGeographySearch;
