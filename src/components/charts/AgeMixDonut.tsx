// src/components/charts/AgeMixDonut.tsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import type { AgeGroups } from "../../types/demographic";

type Props = { ageGroups: AgeGroups; height?: number };

// Softer, Apple-like palette: children, adults, seniors
const COLORS = ["#93c5fd", "#60a5fa", "#c4b5fd"];

const AgeMixDonut: React.FC<Props> = ({ ageGroups, height = 220 }) => {
  const data = useMemo(() => {
    const arr = [
      { name: "Children (0–18)", value: ageGroups.children },
      { name: "Adults (19–64)", value: ageGroups.adults },
      { name: "Seniors (65+)", value: ageGroups.seniors },
    ];
    const total = Math.max(
      1,
      arr.reduce((s, a) => s + (a.value || 0), 0)
    );
    return arr.map((a) => ({ ...a, pct: (a.value / total) * 100 }));
  }, [ageGroups]);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, padding: 8 }}
            formatter={(
              v: number,
              _k: string,
              payload?: { payload?: { pct?: number; name?: string } }
            ) => {
              const pct = payload?.payload?.pct;
              const name = payload?.payload?.name ?? "";
              const count = Math.round(v).toLocaleString();
              return [
                pct != null ? `${pct.toFixed(1)}% (${count})` : count,
                name,
              ];
            }}
          />
          <Legend verticalAlign="bottom" height={24} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AgeMixDonut;
