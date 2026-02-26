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
  }
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
          if (typeof value === "string") {
            return parseDate(value);
          }
          if (
            value &&
            typeof value === "object" &&
            typeof value.year === "number" &&
            typeof value.month === "number" &&
            typeof value.day === "number"
          ) {
            const yyyy = String(value.year).padStart(4, "0");
            const mm = String(value.month).padStart(2, "0");
            const dd = String(value.day).padStart(2, "0");
            return parseDate(`${yyyy}-${mm}-${dd}`);
          }
        }
        return value;
      }),
  }
);
