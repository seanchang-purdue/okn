// src/components/charts/AgeCohortBars.tsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { AgeDistribution } from "../../types/demographic";

type Props = { ageDistribution: AgeDistribution; height?: number };

type Row = {
  age: string;
  malePct: number;
  femalePct: number;
  male: number;
  female: number;
};

const AgeCohortBars: React.FC<Props> = ({ ageDistribution, height = 260 }) => {
  const data: Row[] = useMemo(() => {
    const maleArr = ageDistribution.Male || [];
    const femaleArr = ageDistribution.Female || [];

    const maleMap = new Map<string, number>();
    const femaleMap = new Map<string, number>();
    for (const m of maleArr)
      maleMap.set(m.age_group, Math.max(0, Math.round(m.count || 0)));
    for (const f of femaleArr)
      femaleMap.set(f.age_group, Math.max(0, Math.round(f.count || 0)));

    const keys = Array.from(
      new Set<string>([...maleMap.keys(), ...femaleMap.keys()])
    );
    const parseMin = (k: string) => {
      const m = k.match(/\d+/);
      return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
    };
    keys.sort((a, b) => parseMin(a) - parseMin(b));

    const totals = keys.reduce(
      (s, k) => s + (maleMap.get(k) ?? 0) + (femaleMap.get(k) ?? 0),
      0
    );
    const total = Math.max(1, totals);

    return keys.map<Row>((k) => {
      const male = maleMap.get(k) ?? 0;
      const female = femaleMap.get(k) ?? 0;
      return {
        age: k,
        malePct: (male / total) * 100,
        femalePct: (female / total) * 100,
        male,
        female,
      };
    });
  }, [ageDistribution]);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 16, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="age" tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis
            tickFormatter={(t) => `${t}%`}
            stroke="#6b7280"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            label={{
              value: "% of population",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, padding: 8 }}
            formatter={(v: number, k: string, p) => {
              const label = k === "malePct" ? "Male" : "Female";
              const count =
                k === "malePct" ? p?.payload?.male : p?.payload?.female;
              return [
                `${(v as number).toFixed(1)}% (${(count ?? 0).toLocaleString()})`,
                label,
              ];
            }}
          />
          <Legend />
          <Bar dataKey="malePct" name="Male" fill="#60a5fa" />
          <Bar dataKey="femalePct" name="Female" fill="#f472b6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AgeCohortBars;
