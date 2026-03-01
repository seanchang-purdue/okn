import { memo } from "react";
import type { StatBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";

interface StatBlockProps {
  data: StatBlockData;
}

const StatBlock = ({ data }: StatBlockProps) => {
  const deltaClass =
    typeof data.delta !== "number"
      ? "text-[var(--chat-muted)]"
      : data.delta >= 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400";

  return (
    <InsightBlock title={data.label}>
      <div className="flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold tracking-tight text-[var(--chat-title)] dark:text-slate-100">
          {data.value}
        </div>

        {typeof data.delta !== "undefined" && (
          <div className={`text-xs font-medium ${deltaClass}`}>
            {data.delta > 0 ? "+" : ""}
            {data.delta}
            {data.deltaLabel ? ` ${data.deltaLabel}` : ""}
          </div>
        )}
      </div>
    </InsightBlock>
  );
};

export default memo(StatBlock);
