// src/components/charts/AgeDistributionChart.tsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AgeGroups } from "../../types/demographic";

interface AgeDistributionChartProps {
  ageGroups: AgeGroups;
}

const AgeDistributionChart: React.FC<AgeDistributionChartProps> = ({
  ageGroups,
}) => {
  const data = [
    {
      name: "Children (0-18)",
      population: ageGroups.children,
      fill: "#8884d8",
    },
    {
      name: "Adults (19-64)",
      population: ageGroups.adults,
      fill: "#83a6ed",
    },
    {
      name: "Seniors (65+)",
      population: ageGroups.seniors,
      fill: "#8dd1e1",
    },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value) => [
              `${value.toLocaleString()} people`,
              "Population",
            ]}
          />
          <Legend />
          <Bar dataKey="population" name="Population" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AgeDistributionChart;
