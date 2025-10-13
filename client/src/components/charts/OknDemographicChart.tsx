import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { useMemo } from "react";
import type { DemographicChartDataType } from "../../types/chart";

interface OknDemographicChartProps {
  title: string;
  data: DemographicChartDataType[];
  sortEnabled?: boolean;
  percentageMode?: boolean;
}

interface AgeRange {
  min: number;
  max: number;
  count: number;
  order: number; // Add order property for chronological sorting
}

type AgeRanges = {
  [key: string]: AgeRange;
};

const OknDemographicChart = ({
  title,
  data,
  sortEnabled = true,
  percentageMode = false,
}: OknDemographicChartProps) => {
  type ProcessedItem = DemographicChartDataType & { order?: number };

  const processedData: ProcessedItem[] = useMemo(() => {
    let result: ProcessedItem[] = [...data];

    if (title.toLowerCase() === "age") {
      // Define age ranges with order for chronological sorting
      const ageRanges: AgeRanges = {
        "Under 18": { min: 0, max: 17, count: 0, order: 1 },
        "18-24": { min: 18, max: 24, count: 0, order: 2 },
        "25-34": { min: 25, max: 34, count: 0, order: 3 },
        "35-44": { min: 35, max: 44, count: 0, order: 4 },
        "45-54": { min: 45, max: 54, count: 0, order: 5 },
        "55-64": { min: 55, max: 64, count: 0, order: 6 },
        "65+": { min: 65, max: Infinity, count: 0, order: 7 },
      };

      // Count incidents for each age range
      data.forEach((item) => {
        const age = parseInt(item.feature);
        for (const [range, { min, max }] of Object.entries(ageRanges)) {
          if (age >= min && age <= max) {
            ageRanges[range].count += item.counts;
            break;
          }
        }
      });

      // Convert to array and filter out empty ranges
      result = Object.entries(ageRanges)
        .map(([range, { count, order }]) => ({
          feature: range,
          counts: count,
          order: order, // Keep the order for sorting
        }))
        .filter((item) => item.counts > 0);

      // Apply sorting based on the toggle
      if (sortEnabled) {
        // Sort by count descending when sortEnabled is true
        result.sort((a, b) => b.counts - a.counts);
      } else {
        // Sort by chronological order when sortEnabled is false
        result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    } else if (["fatal", "latino"].includes(title.toLowerCase())) {
      result = data.map((item) => ({
        feature: item.feature === "1" || item.feature === "1.0" ? "Yes" : "No",
        counts: item.counts,
      }));

      // For binary data, apply sorting based on the toggle
      if (sortEnabled) {
        // Sort by count descending
        result.sort((a, b) => b.counts - a.counts);
      } else {
        // Sort alphabetically (No, Yes) instead of by count
        result.sort((a, b) => a.feature.localeCompare(b.feature));
      }
    } else {
      // For other categories, apply sorting based on the toggle
      if (sortEnabled) {
        // Sort by count descending
        result.sort((a, b) => b.counts - a.counts);
      } else {
        // Sort alphabetically by feature name
        result.sort((a, b) => a.feature.localeCompare(b.feature));
      }
    }

    return result;
  }, [data, title, sortEnabled]);

  type DisplayItem = ProcessedItem & { percent?: number };
  const displayData: DisplayItem[] = useMemo(() => {
    if (!percentageMode) return processedData;
    const total = Math.max(
      1,
      processedData.reduce((s, d) => s + d.counts, 0)
    );
    return processedData.map((d) => ({
      ...d,
      percent: (d.counts / total) * 100,
    }));
  }, [processedData, percentageMode]);

  // Generate monochromatic color scheme
  const barColors = useMemo(() => {
    // For binary data (like Yes/No), use two distinct colors
    if (
      ["fatal", "latino"].includes(title.toLowerCase()) &&
      processedData.length <= 2
    ) {
      return ["#3b82f6", "#93c5fd"]; // blue-500 and blue-300
    }

    // For small datasets (3-4 items), use a few shades
    if (processedData.length <= 4) {
      return ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd"]; // blue-700, blue-500, blue-400, blue-300
    }

    // For larger datasets, generate a gradient
    const numItems = processedData.length;

    // Create an array with the right number of colors
    return Array.from({ length: numItems }, (_, i) => {
      // Calculate opacity based on position (first item has highest opacity)
      const opacity = 0.4 + (0.6 * (numItems - i)) / numItems;

      // Convert opacity to hex component (0.4 -> 66, 1.0 -> ff)
      const hexOpacity = Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0");

      // Return color with opacity
      return `#3b82f6${hexOpacity}`;
    });
  }, [processedData, title]);

  // Tooltip content is inlined below to ensure types are narrow and used

  if (processedData.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 80, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="#6b7280"
              tick={{ fill: "#6b7280" }}
              domain={percentageMode ? [0, 100] : undefined}
              tickFormatter={(v) => (percentageMode ? `${v}%` : `${v}`)}
            />
            <YAxis
              type="category"
              dataKey="feature"
              width={80}
              stroke="#6b7280"
              tick={{ fill: "#6b7280" }}
              tickMargin={10}
            />
            <Tooltip
              content={({
                active,
                payload,
              }: {
                active?: boolean;
                payload?: Array<{
                  value: number;
                  payload: { feature: string };
                }>;
              }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value as number;
                  const label = payload[0].payload.feature as string;
                  const total = processedData.reduce(
                    (sum, item) => sum + item.counts,
                    0
                  );
                  const pct = percentageMode
                    ? val
                    : (val / Math.max(1, total)) * 100;
                  const count = percentageMode
                    ? Math.round((pct / 100) * total)
                    : val;
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {label}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        <span className="font-medium">Count: </span>
                        {count.toLocaleString()}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        {pct.toFixed(1)}% of total
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => (
                <span className="text-gray-700 dark:text-gray-300">
                  {value}
                </span>
              )}
            />
            <Bar
              dataKey={percentageMode ? "percent" : "counts"}
              name={`${title} Distribution`}
              radius={[0, 4, 4, 0]}
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={barColors[index % barColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OknDemographicChart;
