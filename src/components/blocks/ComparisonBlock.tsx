import { memo } from "react";
import type { ComparisonBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";
import { Card, CardContent } from "@/components/ui/card";

interface ComparisonBlockProps {
  data: ComparisonBlockData;
}

const valueTone = (value: string | number): string => {
  if (typeof value === "number") {
    if (value > 0) return "text-emerald-600";
    if (value < 0) return "text-red-600";
    return "text-foreground";
  }

  const numericPrefix = Number(value.replace(/[^0-9+-.]/g, ""));
  if (Number.isFinite(numericPrefix)) {
    if (numericPrefix > 0 && value.trim().startsWith("+")) {
      return "text-emerald-600";
    }
    if (numericPrefix < 0) {
      return "text-red-600";
    }
  }

  return "text-foreground";
};

const ComparisonBlock = ({ data }: ComparisonBlockProps) => {
  return (
    <InsightBlock title="Comparison">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {data.items.map((item) => (
          <Card key={item.label} className="gap-2 bg-muted py-3 shadow-none">
            <CardContent className="px-3">
              <h4 className="text-sm font-semibold text-foreground">
                {item.label}
              </h4>

              <dl className="mt-2 space-y-1.5">
                {Object.entries(item.metrics).map(([metricLabel, metricValue]) => (
                  <div
                    key={metricLabel}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <dt className="text-muted-foreground">{metricLabel}</dt>
                    <dd className={`font-semibold tabular-nums ${valueTone(metricValue)}`}>
                      {metricValue}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </InsightBlock>
  );
};

export default memo(ComparisonBlock);
