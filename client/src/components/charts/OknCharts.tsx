import { useState, useEffect, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { filtersStore, dateRangeStore } from "../../stores/filterStore";
import OknLineChart from "./OknLineChart";
import OknDemographicChart from "./OknDemographicChart";
import type {
  LineChartDataType,
  LineChartRawDataObject,
  DemographicChartDataType,
  DemographicChartRawDataObject,
} from "../../types/chart";
import { filterList } from "../../types/filters";

const serverUrl =
  import.meta.env.PUBLIC_SERVER_URL || "http://localhost:8080/api";

type OknChartsProps = {
  censusBlock: string[] | undefined;
  trigger: number;
};

type SelectedFiltersType = {
  [key: string]: any;
};

const convertYesNoToNumber = (filters: SelectedFiltersType) => {
  const updatedFilters = { ...filters };
  Object.keys(updatedFilters).forEach((key) => {
    const filter = filterList.find((f) => f.key === key);
    if (filter && filter.options && filter.options.includes("Yes")) {
      updatedFilters[key] = updatedFilters[key].map((value: string) =>
        value === "Yes" ? 1.0 : value === "No" ? 0.0 : value
      );
    }
  });
  return updatedFilters;
};

const OknCharts = ({ censusBlock, trigger }: OknChartsProps) => {
  const filters = useStore(filtersStore);
  const dateRange = useStore(dateRangeStore);

  const [lineChartData, setLineChartData] = useState<LineChartDataType[]>([]);
  const [demographicChartData, setDemographicChartData] = useState<{
    [key: string]: DemographicChartDataType[];
  }>({});

  const defaultDates = useMemo(
    () => ({
      start: "2020-01-01",
      end: new Date().toISOString().split("T")[0],
    }),
    []
  );

  useEffect(() => {
    fetchData();
  }, [censusBlock, trigger]);

  const fetchData = async () => {
    const selectedFilters: SelectedFiltersType = filters.selectedKeys.reduce(
      (acc: SelectedFiltersType, key: string) => {
        if (filters[key]) {
          acc[key] = filters[key];
        }
        return acc;
      },
      {}
    );

    const convertedFilters = convertYesNoToNumber(selectedFilters);

    try {
      // Fetch line chart data
      const response = await fetch(serverUrl + "/line-chart-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_date: dateRange?.start?.toString() ?? defaultDates.start,
          end_date: dateRange?.end?.toString() ?? defaultDates.end,
          census_block: JSON.stringify(censusBlock),
          filters: convertedFilters,
        }),
      });
      const data: LineChartRawDataObject = await response.json();
      const chartData = Object.keys(data).map((dateKey) => {
        return { date: dateKey, counts: data[dateKey] } as LineChartDataType;
      });
      setLineChartData(chartData);

      // Fetch demographic chart data for multiple features
      const demographicResponse = await fetch(
        serverUrl + "/demographic-chart-data",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            demographic_features: [
              "sex",
              "race",
              "age",
              "wound",
              "latino",
              "fatal",
            ],
            start_date: dateRange?.start?.toString() ?? defaultDates.start,
            end_date: dateRange?.end?.toString() ?? defaultDates.end,
            census_block: JSON.stringify(censusBlock),
            filters: convertedFilters,
          }),
        }
      );
      const demographicData: { [key: string]: DemographicChartRawDataObject } =
        await demographicResponse.json();

      const processedDemographicData: {
        [key: string]: DemographicChartDataType[];
      } = {};

      for (const [feature, data] of Object.entries(demographicData)) {
        processedDemographicData[feature] = Object.keys(data).map((key) => {
          return { feature: key, counts: data[key] };
        });
      }

      setDemographicChartData(processedDemographicData);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  return (
    <div className="w-full p-4">
      {lineChartData.length === 0 &&
        Object.keys(demographicChartData).length === 0 && (
          <div className="text-lg text-gray-500 mt-4">
            No data available for this census block.
          </div>
        )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <OknLineChart title="Trend" data={lineChartData} />
        </div>
        {Object.entries(demographicChartData).map(([feature, data]) => (
          <div key={feature}>
            <OknDemographicChart title={feature} data={data} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OknCharts;
