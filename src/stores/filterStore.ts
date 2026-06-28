import { persistentAtom } from "@nanostores/persistent";
import { type CalendarDate, parseDate } from "@internationalized/date";
import type { FilterKey, FilterState } from "../types/filters";

// Local replacement for HeroUI's RangeValue<CalendarDate>. Keeps the exact
// stored shape (CalendarDate start/end) so persistence + URL params are unchanged.
export type DateRangeValue = { start: CalendarDate; end: CalendarDate };

export type FilterValues = {
  selectedKeys: FilterKey[];
  [key: string]: unknown;
} & Partial<Omit<FilterState, "dateRange">>;

export const DEFAULT_FILTER_VALUES: FilterValues = { selectedKeys: [] };

// Persistent store for filters
export const filtersStore = persistentAtom<FilterValues>(
  "filtersStore",
  DEFAULT_FILTER_VALUES,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

// Persistent store for date range
export const dateRangeStore = persistentAtom<DateRangeValue | null>(
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
