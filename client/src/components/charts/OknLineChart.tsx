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
  data: LineChartDataType[];
}

const OknLineChart = ({ data }: OknLineChartProps) => {
  const customTick = {
    fontSize: "14px",
  };

  if (data.length === 0) {
    return <></>;
  }

  return (
    <div className="w-1/2 xl:w-1/3 p-8">
      <ResponsiveContainer width="100%" height="100%" aspect={4 / 2}>
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#3b82f6" tick={customTick} />
          <YAxis dataKey="counts" />
          <Line type="monotone" dataKey="counts" stroke="#3b82f6" />
          <Tooltip />
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OknLineChart;
