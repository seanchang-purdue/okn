// src/components/charts/RaceDistributionChart.tsx
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
import type { RaceDistribution } from "../../types/demographic";

interface RaceDistributionChartProps {
  raceData: RaceDistribution;
}

const RaceDistributionChart: React.FC<RaceDistributionChartProps> = ({
  raceData,
}) => {
  const data = useMemo(() => {
    const entries = Object.entries(raceData).map(([name, value]) => ({
      name,
      count: value,
    }));
    const total = Math.max(
      1,
      entries.reduce((s, d) => s + d.count, 0)
    );
    return entries
      .map((d) => ({ ...d, pct: (d.count / total) * 100 }))
      .sort((a, b) => b.pct - a.pct);
  }, [raceData]);

  const COLORS = [
    "#2563eb",
    "#22c55e",
    "#eab308",
    "#f97316",
    "#8b5cf6",
    "#10b981",
    "#84cc16",
    "#06b6d4",
    "#f43f5e",
    "#64748b",
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 100, bottom: 8 }}
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
            width={100}
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
          <Bar dataKey="pct" name="Population Share" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RaceDistributionChart;
