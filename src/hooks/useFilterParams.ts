"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@nanostores/react";
import {
  filtersStore,
  dateRangeStore,
  type FilterValues,
} from "../stores/filterStore";
import { parseFilterParams } from "../utils/filters/parseFilterParams";
import {
  MANAGED_FILTER_QUERY_KEYS,
  serializeFilterParams,
} from "../utils/filters/serializeFilterParams";

const sortParams = (params: URLSearchParams): URLSearchParams => {
  const sorted = new URLSearchParams();
  Array.from(params.keys())
    .sort()
    .forEach((key) => {
      const values = params.getAll(key);
      values.forEach((value) => sorted.append(key, value));
    });
  return sorted;
};

const normalizeStringList = (input: unknown): string[] => {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0)
    )
  ).sort();
};

const normalizeFilters = (filters: FilterValues): FilterValues => {
  const normalized: FilterValues = { ...filters, selectedKeys: [] };

  normalized.selectedKeys = Array.from(new Set(filters.selectedKeys || []))
    .map((key) => String(key))
    .sort() as FilterValues["selectedKeys"];

  const normalizedTaxonomy = normalizeStringList(filters.incidentTaxonomy);
  if (normalizedTaxonomy.length > 0) {
    normalized.incidentTaxonomy = normalizedTaxonomy;
  } else {
    delete normalized.incidentTaxonomy;
  }

  return normalized;
};

const isSameDateRange = (
  current: ReturnType<typeof dateRangeStore.get>,
  next: ReturnType<typeof dateRangeStore.get>
): boolean => {
  if (!current && !next) return true;
  if (!current || !next) return false;
  return (
    current.start.toString() === next.start.toString() &&
    current.end.toString() === next.end.toString()
  );
};

export interface UseFilterParamsResult {
  isEmbedMode: boolean;
  isHydrated: boolean;
}

const useFilterParams = (): UseFilterParamsResult => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filtersValue = useStore(filtersStore);
  const dateRangeValue = useStore(dateRangeStore);
  const [isHydrated, setIsHydrated] = useState(false);

  const hydratedFromUrlRef = useRef(false);
  const lastReplacedQueryRef = useRef<string | null>(null);
  const searchParamsString = searchParams.toString();

  const parsed = useMemo(
    () => parseFilterParams(new URLSearchParams(searchParamsString)),
    [searchParamsString]
  );

  // URL -> stores hydration
  useEffect(() => {
    const normalizedParsed = normalizeFilters(parsed.filters);
    const normalizedCurrent = normalizeFilters(filtersStore.get());

    if (JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedParsed)) {
      filtersStore.set(normalizedParsed);
    }

    const currentDateRange = dateRangeStore.get();
    if (!isSameDateRange(currentDateRange, parsed.dateRange)) {
      dateRangeStore.set(parsed.dateRange);
    }

    hydratedFromUrlRef.current = true;
    setIsHydrated(true);
  }, [parsed]);

  // Stores -> URL updates
  useEffect(() => {
    if (!hydratedFromUrlRef.current) return;

    const mergedParams = new URLSearchParams(searchParamsString);
    for (const key of MANAGED_FILTER_QUERY_KEYS) {
      mergedParams.delete(key);
    }

    const serialized = serializeFilterParams({
      filters: normalizeFilters(filtersValue),
      dateRange: dateRangeValue,
    });

    serialized.forEach((value, key) => {
      mergedParams.set(key, value);
    });

    const currentSorted = sortParams(new URLSearchParams(searchParamsString)).toString();
    const nextSorted = sortParams(mergedParams).toString();

    if (currentSorted === nextSorted) {
      lastReplacedQueryRef.current = nextSorted;
      return;
    }
    if (lastReplacedQueryRef.current === nextSorted) return;

    lastReplacedQueryRef.current = nextSorted;
    const nextUrl = nextSorted ? `${pathname}?${nextSorted}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [dateRangeValue, filtersValue, pathname, router, searchParamsString]);

  return {
    isEmbedMode: parsed.embed,
    isHydrated,
  };
};

export default useFilterParams;
