import { memo } from "react";
import type { StatBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";

interface StatBlockProps {
  data: StatBlockData;
}

const StatBlock = ({ data }: StatBlockProps) => {
  const deltaClass =
    typeof data.delta !== "number"
      ? "text-ink-3"
      : data.delta >= 0
        ? "text-positive"
        : "text-negative";

  return (
    <InsightBlock title={data.label}>
      <div className="flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold tabular-nums tracking-tight text-ink-1">
          {data.value}
        </div>

        {typeof data.delta !== "undefined" && (
          <div className={`text-caption font-medium tabular-nums ${deltaClass}`}>
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
