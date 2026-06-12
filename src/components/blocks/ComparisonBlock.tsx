import { memo } from "react";
import type { ComparisonBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";

interface ComparisonBlockProps {
  data: ComparisonBlockData;
}

const valueTone = (value: string | number): string => {
  if (typeof value === "number") {
    if (value > 0) return "text-positive";
    if (value < 0) return "text-negative";
    return "text-ink-2";
  }

  const numericPrefix = Number(value.replace(/[^0-9+-.]/g, ""));
  if (Number.isFinite(numericPrefix)) {
    if (numericPrefix > 0 && value.trim().startsWith("+")) {
      return "text-positive";
    }
    if (numericPrefix < 0) {
      return "text-negative";
    }
  }

  return "text-ink-2";
};

const ComparisonBlock = ({ data }: ComparisonBlockProps) => {
  return (
    <InsightBlock title="Comparison">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {data.items.map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-line-1 bg-surface-2 p-3"
          >
            <h4 className="text-body font-semibold text-ink-1">
              {item.label}
            </h4>

            <dl className="mt-2 space-y-1.5">
              {Object.entries(item.metrics).map(([metricLabel, metricValue]) => (
                <div key={metricLabel} className="flex items-center justify-between gap-3 text-body">
                  <dt className="text-ink-3">{metricLabel}</dt>
                  <dd className={`font-semibold tabular-nums ${valueTone(metricValue)}`}>
                    {metricValue}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </InsightBlock>
  );
};

export default memo(ComparisonBlock);
