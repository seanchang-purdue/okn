import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DemographicChartDataType } from "../../../types/chart";

interface OknDemographicChartProps {
  title: string;
  data: DemographicChartDataType[];
}

interface AgeRange {
  min: number;
  max: number;
  count: number;
}

type AgeRanges = {
  [key: string]: AgeRange;
};

const OknDemographicChart = ({ title, data }: OknDemographicChartProps) => {
  let processedData = data;

  if (title.toLowerCase() === "age") {
    const ageRanges: AgeRanges = {
      "Under 18": { min: 0, max: 17, count: 0 },
      "18-24": { min: 18, max: 24, count: 0 },
      "25-34": { min: 25, max: 34, count: 0 },
      "35-44": { min: 35, max: 44, count: 0 },
      "45-54": { min: 45, max: 54, count: 0 },
      "55-64": { min: 55, max: 64, count: 0 },
      "65 and over": { min: 65, max: Infinity, count: 0 },
    };

    data.forEach((item) => {
      const age = parseInt(item.feature);
      for (const [range, { min, max }] of Object.entries(ageRanges)) {
        if (age >= min && age <= max) {
          ageRanges[range].count += item.counts;
          break;
        }
      }
    });

    processedData = Object.entries(ageRanges).map(([range, { count }]) => ({
      feature: range,
      counts: count,
    }));
  } else if (["fatal", "latino"].includes(title.toLowerCase())) {
    processedData = data.map(item => ({
      feature: item.feature === "1" || item.feature === "1.0" ? "Yes" : "No",
      counts: item.counts
    }));
  }


  if (processedData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg hover:shadow-lg hover:dark:shadow-gray-600 hover:dark:shadow-lg transition duration-150">
      <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
      <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis type="number" />
            <YAxis type="category" dataKey="feature" width={80} />
            <Tooltip />
            <Legend />
            <Bar dataKey="counts" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OknDemographicChart;
