import { memo } from "react";
import type { ComparisonBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";

interface ComparisonBlockProps {
  data: ComparisonBlockData;
}

const valueTone = (value: string | number): string => {
  if (typeof value === "number") {
    if (value > 0) return "text-emerald-600 dark:text-emerald-400";
    if (value < 0) return "text-rose-600 dark:text-rose-400";
    return "text-slate-700 dark:text-slate-200";
  }

  const numericPrefix = Number(value.replace(/[^0-9+-.]/g, ""));
  if (Number.isFinite(numericPrefix)) {
    if (numericPrefix > 0 && value.trim().startsWith("+")) {
      return "text-emerald-600 dark:text-emerald-400";
    }
    if (numericPrefix < 0) {
      return "text-rose-600 dark:text-rose-400";
    }
  }

  return "text-slate-700 dark:text-slate-200";
};

const ComparisonBlock = ({ data }: ComparisonBlockProps) => {
  return (
    <InsightBlock title="Comparison">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {data.items.map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-[var(--chat-border)] bg-[var(--apple-notion-pill)] p-3"
          >
            <h4 className="text-[13px] font-semibold text-[var(--chat-title)] dark:text-slate-100">
              {item.label}
            </h4>

            <dl className="mt-2 space-y-1.5">
              {Object.entries(item.metrics).map(([metricLabel, metricValue]) => (
                <div key={metricLabel} className="flex items-center justify-between gap-3 text-[13px]">
                  <dt className="text-[var(--chat-muted)]">{metricLabel}</dt>
                  <dd className={`font-semibold ${valueTone(metricValue)}`}>
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
