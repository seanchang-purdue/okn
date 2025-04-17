import { Button, Tooltip } from "@heroui/react";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { filtersStore, dateRangeStore } from "../../stores/filterStore";
import OknChartsDrawer from "../drawers/OknChartsDrawer";
import FloatingChart from "./FloatingChart";
import type {
  LineChartDataType,
  LineChartRawDataObject,
  DemographicChartDataType,
  DemographicChartRawDataObject,
} from "../../types/chart";
import { filterList } from "../../types/filters";
import ChartIcon from "../../icons/chart";

// Temporary data for the floating chart
const tempYearlyData = [
  { year: "2020", fatal: 12, nonFatal: 45 },
  { year: "2021", fatal: 18, nonFatal: 52 },
  { year: "2022", fatal: 15, nonFatal: 48 },
  { year: "2023", fatal: 10, nonFatal: 38 },
  { year: "2024", fatal: 14, nonFatal: 43 },
];

const serverUrl =
  import.meta.env.PUBLIC_SERVER_URL || "http://localhost:8080/api";

type OknChartsProps = {
  censusBlock: string[] | undefined;
  trigger: number;
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

interface FilterValues {
  selectedKeys: string[];
  [key: string]: Array<string | number> | string[];
}

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

const OknCharts = ({ censusBlock, trigger }: OknChartsProps) => {
  const filters = useStore(filtersStore) as FilterValues;
  const dateRange = useStore(dateRangeStore);

  const [lineChartData, setLineChartData] = useState<LineChartDataType[]>([]);
  const [demographicChartData, setDemographicChartData] = useState<{
    [key: string]: DemographicChartDataType[];
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // For floating chart
  const [yearlyData, setYearlyData] = useState(tempYearlyData);
  const [showFloatingChart, setShowFloatingChart] = useState(true);

  // Gradient animation state
  const [gradientStyle, setGradientStyle] = useState({
    background: "linear-gradient(135deg, #1d4ed8, #38bdf8)",
  });

  const moveGradient = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = (event.target as HTMLButtonElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setGradientStyle({
      background: `radial-gradient(circle at ${x}% ${y}%, #38bdf8, #1d4ed8)`,
    });
  };

  const leaveGradient = () => {
    setGradientStyle({
      background: "linear-gradient(135deg, #1d4ed8, #38bdf8)",
    });
  };

  const defaultDates = useMemo(
    () => ({
      start: "2020-01-01",
      end: new Date().toISOString().split("T")[0],
    }),
    []
  );

  useEffect(() => {
    if (isDrawerOpen) {
      fetchData();
      setShowFloatingChart(false);
    } else {
      setShowFloatingChart(true);
    }
  }, [censusBlock, trigger, isDrawerOpen]);

  const fetchYearlyData = async () => {
    // For now, just using the temp data
    setYearlyData(tempYearlyData);

    // In the future, you would implement an API call like:
    /*
    try {
      const response = await fetch(serverUrl + "/yearly-incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          census_block: JSON.stringify(censusBlock),
          filters: convertedFilters,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setYearlyData(result.data);
      }
    } catch (error) {
      console.error("Error fetching yearly data: ", error);
    }
    */
  };

  const fetchData = async () => {
    if (!isDrawerOpen) return;

    setIsLoading(true);
    const selectedFilters: SelectedFiltersType = filters.selectedKeys.reduce(
      (acc: SelectedFiltersType, key: string) => {
        if (filters[key]) {
          acc[key] = filters[key] as Array<string | number>;
        }
        return acc;
      },
      {} as SelectedFiltersType
    );

    const convertedFilters = convertYesNoToNumber(selectedFilters);
    setError(null);

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

      const lineResult: ApiResponse<LineChartRawDataObject> =
        await response.json();

      if (!lineResult.success) {
        setError(lineResult.error || "Error fetching line chart data");
        setIsLoading(false);
        return;
      }

      const chartData = Object.keys(lineResult.data).map((dateKey) => {
        return {
          date: dateKey,
          counts: lineResult.data[dateKey],
        } as LineChartDataType;
      });
      setLineChartData(chartData);

      // Fetch demographic chart data
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

      const demographicResult: ApiResponse<{
        [key: string]: DemographicChartRawDataObject;
      }> = await demographicResponse.json();

      if (!demographicResult.success) {
        setError(demographicResult.error || "Error fetching demographic data");
        setIsLoading(false);
        return;
      }

      const processedDemographicData: {
        [key: string]: DemographicChartDataType[];
      } = {};

      for (const [feature, data] of Object.entries(demographicResult.data)) {
        processedDemographicData[feature] = Object.keys(data).map((key) => {
          return { feature: key, counts: data[key] };
        });
      }

      setDemographicChartData(processedDemographicData);

      fetchYearlyData();
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setError("Failed to fetch chart data");
      setIsLoading(false);
    }
  };

  // Fetch yearly data when component mounts
  useEffect(() => {
    fetchYearlyData();
  }, [censusBlock, trigger]);

  return (
    <>
      {/* Floating Chart Component */}
      {showFloatingChart && !isDrawerOpen && (
        <FloatingChart
          data={yearlyData}
          onExpandClick={() => setIsDrawerOpen(true)}
        />
      )}

      {/* Animated Gradient Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Tooltip
          content="📊 View incident analytics and trends based on your current selections"
          placement="top"
        >
          <Button
            className="text-white shadow-lg transition-all duration-150 ease-in-out hover:shadow-md hover:shadow-blue-400/50 hover:scale-105 active:scale-100"
            radius="full"
            size="lg"
            style={gradientStyle}
            isLoading={isLoading}
            onPress={() => setIsDrawerOpen(true)}
            onMouseMove={moveGradient}
            onMouseLeave={leaveGradient}
            isIconOnly
          >
            <ChartIcon />
          </Button>
        </Tooltip>
      </div>

      {/* Charts Drawer */}
      <OknChartsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        lineChartData={lineChartData}
        demographicChartData={demographicChartData}
        error={error}
        isLoading={isLoading}
      />
    </>
  );
};

export default OknCharts;
