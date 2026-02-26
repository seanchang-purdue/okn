// src/components/charts/IncomeDistributionChart.tsx
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { IncomeDistributionItem } from "../../types/demographic";

interface IncomeDistributionChartProps {
  distribution: IncomeDistributionItem[] | undefined;
  mode?: "households" | "percentage";
}

const IncomeDistributionChart: React.FC<IncomeDistributionChartProps> = ({
  distribution,
  mode = "households",
}) => {
  const data = useMemo(() => {
    const sorted = (distribution || []).slice().sort((a, b) => {
      const sa = a?.sort_order ?? 999;
      const sb = b?.sort_order ?? 999;
      return sa - sb;
    });
    return sorted.map((d) => ({
      name: d.bracket_name,
      households: d.households ?? 0,
      percentage: d.pct_households ?? 0,
    }));
  }, [distribution]);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 10, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            interval={0}
            height={80}
          />
          <YAxis
            label={{
              value:
                mode === "percentage" ? "Percent of households" : "Households",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "percentage")
                return [`${value.toFixed(1)}%`, "Percent of households"];
              return [value.toLocaleString(), "Households"];
            }}
          />
          <Bar
            dataKey={mode === "percentage" ? "percentage" : "households"}
            fill="#5B8DEF"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeDistributionChart;
