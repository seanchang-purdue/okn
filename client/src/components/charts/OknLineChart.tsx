import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LineChartDataType } from "../../../types/chart";

interface OknLineChartProps {
  title: string;
  data: LineChartDataType[];
}

const OknLineChart = ({ title, data }: OknLineChartProps) => {
  if (data.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg hover:shadow-lg hover:dark:shadow-gray-600 hover:dark:shadow-lg transition duration-150">
      <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
      <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="date" stroke="#3b82f6" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="counts" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OknLineChart;
