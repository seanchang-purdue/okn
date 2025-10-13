// src/components/charts/RaceStackedBar100.tsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { RaceDistribution } from "../../types/demographic";

const RACE_COLORS: Record<string, string> = {
  White: "#94a3b8",
  "Black or African American": "#f59e0b",
  "American Indian and Alaska Native": "#a78bfa",
  Asian: "#10b981",
  "Native Hawaiian and Other Pacific Islander": "#14b8a6",
  "Some Other Race": "#ef4444",
  "Two or More Races": "#6366f1",
};

type Props = { race: RaceDistribution; height?: number };

const RaceStackedBar100: React.FC<Props> = ({ race, height = 220 }) => {
  const { keys, row } = useMemo(() => {
    const entries = Object.entries(race || {});
    const total = Math.max(
      1,
      entries.reduce((s, [, c]) => s + c, 0)
    );
    const withPct = entries.map(([name, count]) => ({
      name,
      pct: (count / total) * 100,
    }));
    withPct.sort((a, b) => b.pct - a.pct);

    const row: Record<string, number> = {};
    withPct.forEach((r) => {
      row[r.name] = r.pct;
    });
    return { keys: withPct.map((r) => r.name), row };
  }, [race]);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[row]}
          layout="vertical"
          margin={{ left: 12, right: 12 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            hide
            tickFormatter={(t) => `${t}%`}
          />
          <YAxis
            type="category"
            dataKey={() => "Race composition"}
            tick={{ fontSize: 12 }}
            width={140}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, padding: 8 }}
            formatter={(v: number, k: string) => {
              const pct = (v as number).toFixed(1) + "%";
              const count = (race as Record<string, number>)[k] ?? 0;
              return [`${pct} (${count.toLocaleString()} people)`, k];
            }}
          />
          <Legend />
          {keys.map((k) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="race"
              fill={RACE_COLORS[k] || "#64748b"}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RaceStackedBar100;
