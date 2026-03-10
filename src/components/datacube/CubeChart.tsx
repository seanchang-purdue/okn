// src/components/datacube/CubeChart.tsx
"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { pivotRows } from "../../utils/pivotRows";
import type { DatacubeQueryResponse, DisplayMode } from "../../types/datacube";

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6",
];

interface Props {
  result: DatacubeQueryResponse;
  mode: DisplayMode;
}

export default function CubeChart({ result, mode }: Props) {
  const { rows, meta } = result;
  const { tableRows, colKeys } = pivotRows(rows, meta.row_dims, meta.col_dims);

  const xKey = "_rowLabel";
  const chartData = tableRows.map((row) => ({
    ...row,
    [xKey]: meta.row_dims.map((d) => String(row[d])).join(" / "),
  }));

  const seriesKeys = colKeys.length > 0 ? colKeys : ["value"];

  const sharedProps = {
    data: chartData,
    margin: { top: 10, right: 20, left: 10, bottom: 60 },
  };

  const commonChildren = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--default-200)" />
      <XAxis
        dataKey={xKey}
        tick={{ fontSize: 11, fill: "var(--foreground)" }}
        angle={-35}
        textAnchor="end"
        interval={0}
      />
      <YAxis tick={{ fontSize: 11, fill: "var(--foreground)" }} />
      <Tooltip />
      {seriesKeys.length > 1 && <Legend />}
    </>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      {mode === "line" ? (
        <LineChart {...sharedProps}>
          {commonChildren}
          {seriesKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart {...sharedProps}>
          {commonChildren}
          {seriesKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={COLORS[i % COLORS.length]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
