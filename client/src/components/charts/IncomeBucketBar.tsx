// src/components/charts/IncomeBucketBar.tsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { IncomeDistributionItem } from "../../types/demographic";

type Props = {
  distribution: IncomeDistributionItem[] | undefined;
  height?: number;
};

const IncomeBucketBar: React.FC<Props> = ({ distribution, height = 160 }) => {
  const buckets = useMemo(() => {
    const items = (distribution || []).slice();
    let low = 0;
    let mid = 0;
    let high = 0;
    let total = 0;
    for (const b of items) {
      const count = Math.max(0, Math.round(b.households ?? 0));
      total += count;
      const max = b.max_income ?? null;
      if (max !== null && max < 25000) low += count;
      else if (max === null || max >= 75000) high += count;
      else mid += count;
    }
    const toPct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
    return [{ Low: toPct(low), Middle: toPct(mid), High: toPct(high) }];
  }, [distribution]);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={buckets}
          layout="vertical"
          margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            hide
            tickFormatter={(t) => `${t}%`}
          />
          <YAxis type="category" dataKey={() => "Income buckets"} hide />
          <Tooltip
            contentStyle={{ borderRadius: 8, padding: 8 }}
            formatter={(v: number, k: string) => [
              `${(v as number).toFixed(1)}%`,
              k,
            ]}
          />
          <Bar dataKey="Low" stackId="i" fill="#fca5a5" />
          <Bar dataKey="Middle" stackId="i" fill="#fde68a" />
          <Bar dataKey="High" stackId="i" fill="#86efac" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeBucketBar;
