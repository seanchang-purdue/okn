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
import type { DataMode, IntervalMode } from "../../types/filters";

interface OknLineChartProps {
  title: string;
  data: LineChartDataType[];
  sortEnabled?: boolean;
  dataMode?: DataMode;
  interval?: IntervalMode;
}

const getQuarterLabel = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
};

const getSortTimestamp = (raw: string) => {
  const quarterMatch = raw.match(/^(\d{4})[-/ ]?Q([1-4])$/i);
  if (quarterMatch) {
    const year = Number(quarterMatch[1]);
    const quarter = Number(quarterMatch[2]);
    return new Date(year, (quarter - 1) * 3, 1).getTime();
  }

  const yearOnlyMatch = raw.match(/^\d{4}$/);
  if (yearOnlyMatch) {
    return new Date(Number(raw), 0, 1).getTime();
  }

  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatAxisDate = (raw: string, interval: IntervalMode) => {
  const quarterMatch = raw.match(/^(\d{4})[-/ ]?Q([1-4])$/i);
  if (quarterMatch) {
    return `Q${quarterMatch[2]} ${quarterMatch[1]}`;
  }

  const yearOnlyMatch = raw.match(/^\d{4}$/);
  if (yearOnlyMatch) {
    return raw;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  if (interval === "yearly") {
    return String(date.getFullYear());
  }

  if (interval === "quarterly") {
    return getQuarterLabel(date);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
};

const OknLineChart = ({
  data,
  dataMode = "incidents",
  interval = "yearly",
}: OknLineChartProps) => {
  const processedData = useMemo(() => {
    return [...data].sort((a, b) => getSortTimestamp(a.date) - getSortTimestamp(b.date));
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
  interface TooltipPayloadItem {
    value: number;
  }
  interface TooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
  }
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md"
          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
        >
          <p className="font-medium text-gray-900 dark:text-white">
            {formatAxisDate(String(label || ""), interval)}
          </p>
          <p className="text-blue-600 dark:text-blue-400 mt-1">
            <span className="font-medium">
              {dataMode === "victims" ? "Victims: " : "Incidents: "}
            </span>
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
              tickFormatter={(value) => formatAxisDate(String(value), interval)}
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
              name={dataMode === "victims" ? "Victim Count" : "Incident Count"}
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
