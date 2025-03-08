// src/components/charts/GenderDistributionChart.tsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { GenderDistribution } from "../../types/demographic";

interface GenderDistributionChartProps {
  genderData: GenderDistribution;
}

const GenderDistributionChart: React.FC<GenderDistributionChartProps> = ({
  genderData,
}) => {
  const data = [
    { name: "Male", value: genderData.male },
    { name: "Female", value: genderData.female },
  ];

  const COLORS = ["#0088FE", "#FF8042"];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [
              `${value.toLocaleString()} people`,
              "Population",
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GenderDistributionChart;
