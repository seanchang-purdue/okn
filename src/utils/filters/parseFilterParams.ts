import type { CalendarDate, RangeValue } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import type { FilterKey } from "../../types/filters";
import { filterList } from "../../types/filters";
import {
  DATE_END_PARAM,
  DATE_START_PARAM,
  FILTERS_PARAM,
  FILTER_VALUE_PREFIX,
} from "./serializeFilterParams";
import { DEFAULT_FILTER_VALUES, type FilterValues } from "../../stores/filterStore";

const validFilterKeys = new Set<FilterKey>(
  filterList.map((filter) => filter.key as FilterKey)
);

const optionByKey = new Map(
  filterList
    .filter((filter) => filter.options)
    .map((filter) => [filter.key, new Set(filter.options)])
);

const parseCsv = (raw: string | null): string[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const normalizeStringList = (values: string[]): string[] =>
  Array.from(new Set(values)).sort();

const parseNumber = (raw: string | null): number | undefined => {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

const parseCalendarDate = (raw: string | null): CalendarDate | null => {
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  try {
    return parseDate(raw);
  } catch {
    return null;
  }
};

const parseFilterValue = (key: FilterKey, raw: string | null): unknown => {
  if (!raw) return undefined;

  if (key === "age") {
    const parsedAge = parseCsv(raw)
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
    if (parsedAge.length === 0) return undefined;
    return parsedAge.length === 1 ? parsedAge[0] : parsedAge;
  }

  const allowedOptions = optionByKey.get(key);
  if (!allowedOptions) return raw;

  const parsedValues = parseCsv(raw).filter((item) => allowedOptions.has(item));
  return parsedValues.length > 0 ? parsedValues : undefined;
};

export interface ParsedFilterParams {
  filters: FilterValues;
  dateRange: RangeValue<CalendarDate> | null;
  embed: boolean;
}

export const parseFilterParams = (params: URLSearchParams): ParsedFilterParams => {
  const filters: FilterValues = {
    ...DEFAULT_FILTER_VALUES,
    selectedKeys: [],
  };

  const selectedKeys = parseCsv(params.get(FILTERS_PARAM)).filter((key): key is FilterKey =>
    validFilterKeys.has(key as FilterKey)
  );

  filters.selectedKeys = Array.from(new Set(selectedKeys));

  for (const key of filters.selectedKeys) {
    const parsedValue = parseFilterValue(
      key,
      params.get(`${FILTER_VALUE_PREFIX}${key}`)
    );
    if (parsedValue === undefined) continue;
    filters[key] = parsedValue as FilterValues[FilterKey];
  }

  const city = params.get("city")?.trim();
  if (city) filters.city = city;

  const victimMode = params.get("victimMode")?.trim();
  if (victimMode === "all" || victimMode === "fatal" || victimMode === "nonfatal") {
    filters.victimMode = victimMode;
  }

  const dataMode = params.get("dataMode")?.trim();
  if (dataMode === "victims" || dataMode === "incidents") {
    filters.dataMode = dataMode;
  }

  const interval = params.get("interval")?.trim();
  if (interval === "monthly" || interval === "quarterly" || interval === "yearly") {
    filters.interval = interval;
  }

  const geography = params.get("geography")?.trim();
  if (geography) filters.geography = geography;

  const geographyType = params.get("geographyType")?.trim();
  if (geographyType) filters.geographyType = geographyType;

  const taxonomy = normalizeStringList(parseCsv(params.get("incidentTaxonomy")));
  if (taxonomy.length > 0) {
    filters.incidentTaxonomy = taxonomy;
  }

  const minKilled = parseNumber(params.get("minKilled"));
  if (minKilled !== undefined) filters.minKilled = minKilled;

  const minInjured = parseNumber(params.get("minInjured"));
  if (minInjured !== undefined) filters.minInjured = minInjured;

  const start = parseCalendarDate(params.get(DATE_START_PARAM));
  const end = parseCalendarDate(params.get(DATE_END_PARAM));

  return {
    filters,
    dateRange: start && end ? { start, end } : null,
    embed: params.get("embed") === "true",
  };
};
