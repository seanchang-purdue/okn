// src/components/charts/RaceDistributionChart.tsx
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { RaceDistribution } from "../../types/demographic";

interface RaceDistributionChartProps {
  raceData: RaceDistribution;
}

const RaceDistributionChart: React.FC<RaceDistributionChartProps> = ({
  raceData,
}) => {
  // Transform the race data into the format Recharts expects
  const data = Object.entries(raceData).map(([name, value]) => ({
    name,
    value,
  }));

  // Colors for different race categories
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#A4DE6C",
    "#D0ED57",
    "#FAD000",
    "#F66D44",
  ];

  return (
    <div className="space-y-4">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
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
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend Grid - Adjusted for drawer context */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {data.map((entry, index) => (
          <div
            key={`legend-${index}`}
            className="flex items-center space-x-2 px-1"
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-left">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RaceDistributionChart;
