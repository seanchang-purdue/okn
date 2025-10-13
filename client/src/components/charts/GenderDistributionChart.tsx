// src/components/charts/GenderDistributionChart.tsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import type { GenderDistribution } from "../../types/demographic";

interface GenderDistributionChartProps {
  genderData: GenderDistribution;
}

const GenderDistributionChart: React.FC<GenderDistributionChartProps> = ({
  genderData,
}) => {
  const data = useMemo(() => {
    const total = Math.max(
      1,
      (genderData.male || 0) + (genderData.female || 0)
    );
    return [
      {
        name: "Male",
        count: genderData.male,
        pct: (genderData.male / total) * 100,
      },
      {
        name: "Female",
        count: genderData.female,
        pct: (genderData.female / total) * 100,
      },
    ];
  }, [genderData]);

  const COLORS = ["#2563eb", "#fb923c"]; // blue-600, orange-400

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            stroke="#6b7280"
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={70}
            stroke="#6b7280"
            tick={{ fill: "#6b7280" }}
          />
          <Tooltip
            content={({
              active,
              payload,
            }: {
              active?: boolean;
              payload?: Array<{
                value: number;
                dataKey?: string;
                payload: { name: string; count?: number; pct?: number };
              }>;
            }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                const isPct = item.dataKey === "pct";
                const val = item.value;
                return (
                  <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.payload.name}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {isPct ? `${val.toFixed(1)}%` : val.toLocaleString()}{" "}
                      {isPct ? "share" : "people"}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GenderDistributionChart;
