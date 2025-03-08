// src/components/charts/AgeHistogramChart.tsx
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
import type { AgeDistribution } from "../../types/demographic";

interface AgeHistogramChartProps {
  ageDistribution: AgeDistribution;
}

const AgeHistogramChart: React.FC<AgeHistogramChartProps> = ({
  ageDistribution,
}) => {
  // Filter and transform the age data for the histogram
  // We'll use the "Total" gender and filter out overlapping age ranges
  const standardAgeRanges = [
    "0-4",
    "5-9",
    "10-14",
    "15-19",
    "20-24",
    "25-29",
    "30-34",
    "35-39",
    "40-44",
    "45-49",
    "50-54",
    "55-59",
    "60-64",
    "65-69",
    "70-74",
    "75-79",
    "80-84",
    "85-120",
  ];

  const data = ageDistribution.Total.filter((age) =>
    standardAgeRanges.includes(age.age_group)
  ).map((age) => ({
    name: age.age_group,
    population: age.count || 0, // Handle potential null/undefined values
    percentage: age.percentage || 0,
  }));

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
            formatter={(value, name) => {
              if (typeof name !== "string") return [value, ""];

              if (name === "population") {
                return typeof value === "number"
                  ? [`${value.toLocaleString()} people`, "Population"]
                  : [value, "Population"];
              } else if (name === "percentage") {
                return typeof value === "number"
                  ? [`${value.toFixed(1)}%`, "Percentage"]
                  : [value, "Percentage"];
              }
              return [value, name];
            }}
          />
          <Legend />
          <Bar dataKey="population" name="Population" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AgeHistogramChart;
