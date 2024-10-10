import { persistentAtom } from "@nanostores/persistent";
import type { RangeValue, CalendarDate } from "@nextui-org/react";
import { parseDate } from "@internationalized/date";

type FilterValues = {
  selectedKeys: string[];
  [key: string]: any;
};

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
