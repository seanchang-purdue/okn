import { persistentAtom } from "@nanostores/persistent";
import type { RangeValue, CalendarDate } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import type { FilterKey, FilterState } from "../types/filters";

// Updated FilterValues type using the existing types
type FilterValues = {
  selectedKeys: FilterKey[];
} & Partial<Omit<FilterState, "dateRange">>;

// Persistent store for filters
export const filtersStore = persistentAtom<FilterValues>(
  "filtersStore",
  { selectedKeys: [] },
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

// Persistent store for date range
export const dateRangeStore = persistentAtom<RangeValue<CalendarDate> | null>(
  "dateRangeStore",
  null,
  {
    encode: JSON.stringify,
    decode: (str) =>
      JSON.parse(str, (key, value) => {
        if (key === "start" || key === "end") {
          return parseDate(value);
        }
        return value;
      }),
  },
);
