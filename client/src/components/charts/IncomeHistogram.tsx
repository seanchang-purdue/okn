// src/components/charts/IncomeHistogram.tsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";
import type { IncomeDistributionItem } from "../../types/demographic";

type Props = {
  distribution: IncomeDistributionItem[] | undefined;
  median: number | null | undefined;
};

const IncomeHistogram: React.FC<Props> = ({ distribution, median }) => {
  const bins = useMemo(() => {
    const arr = (distribution || [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return arr.map((b) => ({
      bin: b.bracket_name,
      households: b.households ?? 0,
      min: b.min_income,
      max: b.max_income,
    }));
  }, [distribution]);

  const medianIdx = useMemo(() => {
    if (!median || bins.length === 0) return -1;
    const idx = bins.findIndex((b) => {
      const min = b.min as number | null;
      const max = b.max as number | null;
      const geMin = min == null || median >= min;
      const ltMax = max == null || median <= max;
      return geMin && ltMax;
    });
    return idx;
  }, [bins, median]);

  const x1 = medianIdx >= 0 ? bins[Math.max(0, medianIdx)].bin : undefined;
  const x2 =
    medianIdx >= 0 ? bins[Math.min(bins.length - 1, medianIdx)].bin : undefined;

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={bins} margin={{ left: 8, right: 8, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="bin"
            interval={0}
            tick={{ fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            height={56}
          />
          <YAxis
            label={{ value: "Households", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            formatter={(v: number, k: string) =>
              k === "households" ? v.toLocaleString() : v
            }
          />
          {medianIdx >= 0 && x1 && x2 ? (
            <ReferenceArea x1={x1} x2={x2} opacity={0.08} />
          ) : null}
          <Bar dataKey="households" fill="#22c55e" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeHistogram;
