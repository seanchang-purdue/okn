import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@heroui/react";
import ChartIcon from "../../icons/chart";

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
  return (
    <div className="fixed top-24 left-[calc(50%+2rem)] z-30 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 w-64 h-48">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold">Incidents by Year</h4>
        <Button
          size="sm"
          isIconOnly
          variant="light"
          onPress={onExpandClick}
          className="text-blue-600"
        >
          <ChartIcon />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[80%]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="80%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
            barCategoryGap={8}
          >
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={36} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value, name, entry) => {
                // Proper formatting for tooltip values
                if (name === "fatal") return [value, "Fatal"];
                if (name === "nonFatal") return [value, "Non-Fatal"];
                return [value, name];
              }}
              itemStyle={{ color: "inherit" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10 }}
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
