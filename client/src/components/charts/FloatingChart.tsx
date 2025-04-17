import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@heroui/react";
import ChartIcon from "../../icons/chart";

type YearlyDataType = {
  year: string;
  fatal: number;
  nonFatal: number;
};

type FloatingChartProps = {
  data: YearlyDataType[];
  onExpandClick: () => void;
};

const FloatingChart = ({ data, onExpandClick }: FloatingChartProps) => {
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
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={25} />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value, name) => [value, name === "fatal" ? "Fatal" : "Non-Fatal"]}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="fatal" fill="#ef4444" name="Fatal" />
          <Bar dataKey="nonFatal" fill="#3b82f6" name="Non-Fatal" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FloatingChart;
