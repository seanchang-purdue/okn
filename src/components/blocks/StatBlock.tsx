import { memo } from "react";
import type { StatBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";

interface StatBlockProps {
  data: StatBlockData;
}

const StatBlock = ({ data }: StatBlockProps) => {
  const deltaClass =
    typeof data.delta !== "number"
      ? "text-muted-foreground"
      : data.delta >= 0
        ? "text-emerald-600"
        : "text-red-600";

  return (
    <InsightBlock title={data.label}>
      <div className="flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {data.value}
        </div>

        {typeof data.delta !== "undefined" && (
          <div className={`text-xs font-medium tabular-nums ${deltaClass}`}>
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
