import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useMemo } from "react";
import type { LineChartDataType } from "../../types/chart";

interface OknLineChartProps {
  title: string;
  data: LineChartDataType[];
  sortEnabled?: boolean;
}

const OknLineChart = ({
  title,
  data,
  sortEnabled = true,
}: OknLineChartProps) => {
  const processedData = useMemo(() => {
    // Always sort by date for line charts (chronological order makes sense)
    // The sortEnabled prop is more relevant for demographic charts
    return [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data]);

  // Calculate average for reference line
  const average = useMemo(() => {
    if (processedData.length === 0) return 0;
    const sum = processedData.reduce((acc, item) => acc + item.counts, 0);
    return Math.round((sum / processedData.length) * 10) / 10;
  }, [processedData]);

  if (processedData.length === 0) {
    return null;
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md"
          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
        >
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-blue-600 dark:text-blue-400 mt-1">
            <span className="font-medium">Incidents: </span>
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              tick={{ fill: "#6b7280" }}
              tickMargin={10}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                });
              }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#6b7280" }}
              tickMargin={10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => (
                <span className="text-gray-700 dark:text-gray-300">
                  {value}
                </span>
              )}
            />
            <ReferenceLine
              y={average}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{
                value: `Avg: ${average}`,
                fill: "#f59e0b",
                position: "right",
              }}
            />
            <Line
              type="monotone"
              dataKey="counts"
              name="Incident Count"
              stroke="#2196f3" // Material Blue
              strokeWidth={2}
              dot={{ fill: "#2196f3", r: 4 }}
              activeDot={{ r: 6, fill: "#1976d2" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OknLineChart;
