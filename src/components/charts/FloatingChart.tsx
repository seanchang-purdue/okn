import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChartIcon from "../../icons/chart";
import { useEffect, useState } from "react";

type YearlyDataType = {
  year: string | number; // Allow both string and number
  fatal: number;
  nonFatal: number;
};

type FloatingChartProps = {
  data: YearlyDataType[];
  onExpandClick: () => void;
  isLoading?: boolean;
};

const FloatingChart = ({
  data,
  onExpandClick,
  isLoading = false,
}: FloatingChartProps) => {
  // Track dark mode to update tooltip styles
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode on component mount and when theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    // Initial check
    checkDarkMode();

    // Set up an observer to detect class changes on the html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Custom tooltip styles based on dark mode
  const tooltipStyle = {
    backgroundColor: isDarkMode ? "#374151" : "white",
    border: `1px solid ${isDarkMode ? "#4b5563" : "#e5e7eb"}`,
    borderRadius: "0.375rem",
    padding: "0.5rem",
    color: isDarkMode ? "#f3f4f6" : "#1f2937",
    boxShadow: isDarkMode
      ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
      : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    fontSize: "12px",
  };

  return (
    <div className="fixed top-24 left-[calc(50%+2rem)] z-30 h-48 w-64 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-xl transition-colors">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold text-foreground">
          Incidents by Year
        </h4>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onExpandClick}
          className="text-primary"
          aria-label="Expand chart"
        >
          <ChartIcon />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[80%]">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height="80%"
          className="text-gray-700 dark:text-gray-300"
        >
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
            barCategoryGap={8}
          >
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10 }}
              stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              width={36}
              stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name, _entry) => {
                void _entry;
                // Proper formatting for tooltip values
                if (name === "fatal") return [value, "Fatal"];
                if (name === "nonFatal") return [value, "Non-Fatal"];
                return [value, name];
              }}
              labelStyle={{
                marginBottom: "0.25rem",
                fontWeight: 600,
                color: isDarkMode ? "#e5e7eb" : "#374151",
              }}
              itemStyle={{
                padding: "0.125rem 0",
                color: isDarkMode ? "#d1d5db" : "#4b5563",
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: 10,
                color: isDarkMode ? "#d1d5db" : "#4b5563",
              }}
              formatter={(value) => {
                // Proper formatting for legend labels
                if (value === "fatal") return "Fatal";
                if (value === "nonFatal") return "Non-Fatal";
                return value;
              }}
            />
            {/* Use stacked bar chart with distinct colors */}
            <Bar dataKey="fatal" fill="#d14343" name="fatal" stackId="a" />
            <Bar
              dataKey="nonFatal"
              fill="#4b83d6"
              name="nonFatal"
              stackId="a"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default FloatingChart;
