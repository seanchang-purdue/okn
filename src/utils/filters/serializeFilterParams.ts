import type { CalendarDate, RangeValue } from "@heroui/react";
import { filterList } from "../../types/filters";
import type { FilterValues } from "../../stores/filterStore";

export const FILTERS_PARAM = "filters";
export const DATE_START_PARAM = "dateStart";
export const DATE_END_PARAM = "dateEnd";
export const FILTER_VALUE_PREFIX = "f_";

const additionalStringFilterKeys = [
  "city",
  "victimMode",
  "dataMode",
  "interval",
  "geography",
  "geographyType",
  "incidentTaxonomy",
] as const;

const additionalNumericFilterKeys = ["minKilled", "minInjured"] as const;

export const MANAGED_FILTER_QUERY_KEYS = [
  FILTERS_PARAM,
  DATE_START_PARAM,
  DATE_END_PARAM,
  ...filterList.map((filter) => `${FILTER_VALUE_PREFIX}${filter.key}`),
  ...additionalStringFilterKeys,
  ...additionalNumericFilterKeys,
] as const;

const toParamValue = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;

  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
    return normalized.length > 0 ? normalized.join(",") : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  return null;
};

export interface SerializeFilterParamsInput {
  filters: FilterValues;
  dateRange: RangeValue<CalendarDate> | null;
}

export const serializeFilterParams = ({
  filters,
  dateRange,
}: SerializeFilterParamsInput): URLSearchParams => {
  const params = new URLSearchParams();

  if (dateRange?.start && dateRange?.end) {
    params.set(DATE_START_PARAM, dateRange.start.toString());
    params.set(DATE_END_PARAM, dateRange.end.toString());
  }

  const selectedKeys = Array.from(new Set(filters.selectedKeys || []))
    .map((key) => String(key))
    .sort();

  if (selectedKeys.length > 0) {
    params.set(FILTERS_PARAM, selectedKeys.join(","));
  }

  for (const key of selectedKeys) {
    const serializedValue = toParamValue(
      filters[key as keyof FilterValues] as unknown
    );
    if (!serializedValue) continue;
    params.set(`${FILTER_VALUE_PREFIX}${key}`, serializedValue);
  }

  for (const key of additionalStringFilterKeys) {
    const serializedValue = toParamValue(filters[key]);
    if (!serializedValue) continue;
    params.set(key, serializedValue);
  }

  for (const key of additionalNumericFilterKeys) {
    const serializedValue = toParamValue(filters[key]);
    if (!serializedValue) continue;
    params.set(key, serializedValue);
  }

  return params;
};
