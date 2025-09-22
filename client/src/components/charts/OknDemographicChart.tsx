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
}: OknDemographicChartProps) => {
  const processedData = useMemo(() => {
    let result = [...data];

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
        type AgeItem = { feature: string; counts: number; order: number };
        (result as AgeItem[]).sort((a, b) => a.order - b.order);
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

  // Custom tooltip
  interface TooltipPayloadItem {
    value: number;
    payload: { feature: string };
  }
  interface TooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
  }
  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const total = processedData.reduce((sum, item) => sum + item.counts, 0);
      const percentage = Math.round((payload[0].value / total) * 100);

      return (
        <div
          className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md"
          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
        >
          <p className="font-medium text-gray-900 dark:text-white">
            {payload[0].payload.feature}
          </p>
          <p className="text-gray-700 dark:text-gray-300 mt-1">
            <span className="font-medium">Count: </span>
            {payload[0].value}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  if (processedData.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 80, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              horizontal={false}
            />
            <XAxis type="number" stroke="#6b7280" tick={{ fill: "#6b7280" }} />
            <YAxis
              type="category"
              dataKey="feature"
              width={80}
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
            <Bar
              dataKey="counts"
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
