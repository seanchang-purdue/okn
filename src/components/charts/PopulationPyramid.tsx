// src/components/charts/PopulationPyramid.tsx
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

type Props = { ageDistribution: AgeDistribution };

type Row = {
  age: string;
  malePct: number; // negative for left side
  femalePct: number;
  male: number;
  female: number;
};

const PopulationPyramid: React.FC<Props> = ({ ageDistribution }) => {
  const data: Row[] = useMemo(() => {
    const maleArr = ageDistribution.Male || [];
    const femaleArr = ageDistribution.Female || [];
    const maleMap = new Map<string, { count: number }>();
    const femaleMap = new Map<string, { count: number }>();

    for (const m of maleArr)
      maleMap.set(m.age_group, {
        count: Math.max(0, Math.round(m.count || 0)),
      });
    for (const f of femaleArr)
      femaleMap.set(f.age_group, {
        count: Math.max(0, Math.round(f.count || 0)),
      });

    const keys = Array.from(
      new Set<string>([...maleMap.keys(), ...femaleMap.keys()])
    );
    // Sort keys by numeric lower bound if possible (e.g., "5-9" -> 5)
    const parseMin = (k: string) => {
      const m = k.match(/\d+/);
      return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
    };
    keys.sort((a, b) => parseMin(a) - parseMin(b));

    // Compute total across union for percent base
    let total = 0;
    for (const k of keys) {
      total += (maleMap.get(k)?.count ?? 0) + (femaleMap.get(k)?.count ?? 0);
    }
    if (total <= 0) return [];

    return keys.map<Row>((k) => {
      const mc = maleMap.get(k)?.count ?? 0;
      const fc = femaleMap.get(k)?.count ?? 0;
      const mPct = (mc / total) * 100;
      const fPct = (fc / total) * 100;
      return {
        age: k,
        malePct: -mPct,
        femalePct: fPct,
        male: mc,
        female: fc,
      };
    });
  }, [ageDistribution]);

  const maxAbsPct = useMemo(() => {
    const arr = data.flatMap((d) => [
      Math.abs(d.malePct),
      Math.abs(d.femalePct),
    ]);
    const v = arr.length ? Math.max(...arr) : 0;
    const base = v < 5 ? 5 : v;
    return Math.ceil(base / 5) * 5; // round up to nearest 5
  }, [data]);

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          stackOffset="sign"
          margin={{ left: 16, right: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            type="number"
            domain={[-maxAbsPct, maxAbsPct]}
            tickFormatter={(t) => `${Math.abs(t)}%`}
            stroke="#6b7280"
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            type="category"
            dataKey="age"
            width={64}
            stroke="#6b7280"
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, padding: 8 }}
            formatter={(v: number, key: string, payload) => {
              const p =
                payload && payload.payload
                  ? (payload.payload as Row)
                  : undefined;
              const label = key === "malePct" ? "Male" : "Female";
              const count =
                key === "malePct" ? (p?.male ?? 0) : (p?.female ?? 0);
              return [
                `${Math.abs(v as number).toFixed(1)}% (${count.toLocaleString()} people)`,
                label,
              ];
            }}
          />
          <Legend />
          <Bar dataKey="malePct" name="Male" stackId="sex" fill="#38bdf8" />
          <Bar dataKey="femalePct" name="Female" stackId="sex" fill="#f472b6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PopulationPyramid;
