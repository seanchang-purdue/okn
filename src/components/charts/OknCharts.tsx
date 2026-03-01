import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { chatModeStore } from "../../stores/chatLayoutStore";
import {
  filtersStore,
  dateRangeStore,
  type FilterValues,
} from "../../stores/filterStore";
import OknChartsPanel from "./OknChartsPanel";
import type {
  LineChartDataType,
  LineChartRawDataObject,
  DemographicChartDataType,
  DemographicChartRawDataObject,
} from "../../types/chart";
import { filterList } from "../../types/filters";
import type { DataMode, IntervalMode } from "../../types/filters";
import { apiUrl } from "../../config/api";

const DEFAULT_START_DATE = "2015-01-01";
const DEFAULT_END_DATE = new Date().toISOString().split("T")[0];

type OknChartsProps = {
  censusBlock: string[] | undefined;
  trigger: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  topInset?: number;
  variant?: "floating" | "inline";
  showCloseButton?: boolean;
  className?: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error: string | null;
  timestamp: string;
};

type SelectedFiltersType = {
  [key: string]: Array<string | number>;
};

const convertYesNoToNumber = (filters: SelectedFiltersType) => {
  const updatedFilters = { ...filters };
  Object.keys(updatedFilters).forEach((key) => {
    const filter = filterList.find((f) => f.key === key);
    if (filter && filter.options && filter.options.includes("Yes")) {
      updatedFilters[key] = updatedFilters[key].map((value: string | number) =>
        typeof value === "string"
          ? value === "Yes"
            ? 1.0
            : value === "No"
              ? 0.0
              : value
          : value
      );
    }
  });
  return updatedFilters;
};

const normalizeFilterValue = (value: unknown): Array<string | number> => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") return item;
        return null;
      })
      .filter((item): item is string | number => item !== null);
  }
  if (typeof value === "string" || typeof value === "number") {
    return [value];
  }
  return [];
};

const OknCharts = ({
  censusBlock,
  trigger,
  isOpen,
  onOpenChange,
  topInset = 64,
  variant = "floating",
  showCloseButton = true,
  className,
}: OknChartsProps) => {
  const filters = useStore(filtersStore);
  const dateRange = useStore(dateRangeStore);
  const chatMode = useStore(chatModeStore);
  const dataMode =
    (typeof filters.dataMode === "string" ? filters.dataMode : "incidents") as DataMode;
  const interval =
    (typeof filters.interval === "string" ? filters.interval : "yearly") as IntervalMode;

  const [lineChartData, setLineChartData] = useState<LineChartDataType[]>([]);
  const [demographicChartData, setDemographicChartData] = useState<{
    [key: string]: DemographicChartDataType[];
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedFilters = useMemo(() => {
    const dynamicFilters: SelectedFiltersType = (filters.selectedKeys || []).reduce(
      (acc: SelectedFiltersType, key: string) => {
        const normalized = normalizeFilterValue(filters[key as keyof FilterValues]);
        if (normalized.length > 0) acc[key] = normalized;
        return acc;
      },
      {}
    );

    const addScalarFilter = (key: keyof FilterValues) => {
      const normalized = normalizeFilterValue(filters[key]);
      if (normalized.length > 0) {
        dynamicFilters[String(key)] = normalized;
      }
    };

    addScalarFilter("victimMode");
    addScalarFilter("minKilled");
    addScalarFilter("minInjured");
    addScalarFilter("dataMode");
    addScalarFilter("interval");
    addScalarFilter("incidentTaxonomy");

    return convertYesNoToNumber(dynamicFilters);
  }, [filters]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const startDate = dateRange?.start?.toString() ?? DEFAULT_START_DATE;
    const endDate = dateRange?.end?.toString() ?? DEFAULT_END_DATE;
    const censusPayload = JSON.stringify(censusBlock ?? []);

    try {
      const lineResponse = await fetch(apiUrl("/line-chart-data"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          census_block: censusPayload,
          filters: selectedFilters,
        }),
      });

      const lineResult: ApiResponse<LineChartRawDataObject> =
        await lineResponse.json();

      if (!lineResult.success) {
        throw new Error(lineResult.error || "Error fetching line chart data");
      }

      const nextLineData: LineChartDataType[] = Object.keys(lineResult.data).map(
        (dateKey) => ({
          date: dateKey,
          counts: lineResult.data[dateKey],
        })
      );

      const demographicResponse = await fetch(apiUrl("/demographic-chart-data"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          demographic_features: ["sex", "race", "age", "wound", "latino", "fatal"],
          start_date: startDate,
          end_date: endDate,
          census_block: censusPayload,
          filters: selectedFilters,
        }),
      });

      const demographicResult: ApiResponse<{
        [key: string]: DemographicChartRawDataObject;
      }> = await demographicResponse.json();

      if (!demographicResult.success) {
        throw new Error(
          demographicResult.error || "Error fetching demographic chart data"
        );
      }

      const nextDemographicData: {
        [key: string]: DemographicChartDataType[];
      } = {};

      for (const [feature, data] of Object.entries(demographicResult.data)) {
        nextDemographicData[feature] = Object.keys(data).map((key) => ({
          feature: key,
          counts: data[key],
        }));
      }

      setLineChartData(nextLineData);
      setDemographicChartData(nextDemographicData);
    } catch (fetchError) {
      console.error("Error fetching chart data:", fetchError);
      const message =
        fetchError instanceof Error ? fetchError.message : "Failed to fetch chart data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [censusBlock, dateRange, selectedFilters]);

  useEffect(() => {
    if (!isOpen) return;
    fetchData();
  }, [isOpen, fetchData, trigger]);

  return (
    <OknChartsPanel
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      lineChartData={lineChartData}
      demographicChartData={demographicChartData}
      error={error}
      isLoading={isLoading}
      dataMode={dataMode}
      interval={interval}
      chatMode={chatMode}
      topInset={topInset}
      variant={variant}
      showCloseButton={showCloseButton}
      className={className}
    />
  );
};

export default OknCharts;
