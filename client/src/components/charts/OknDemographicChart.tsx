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
  data: DemographicChartDataType[];
}

const OknDemographicChart = ({ data }: OknDemographicChartProps) => {
  if (data.length === 0) {
    return <></>;
  }

  return (
    <div className="w-1/2 xl:w-1/3 p-8">
      <ResponsiveContainer width="100%" height="100%" aspect={4 / 2}>
        <BarChart width={700} height={350} data={data} barSize={40} layout="vertical">
          <XAxis type="number" hide/>
          <YAxis type="category" dataKey="feature" />
          <Tooltip />
          <Legend />
          <Bar dataKey="counts" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OknDemographicChart;
