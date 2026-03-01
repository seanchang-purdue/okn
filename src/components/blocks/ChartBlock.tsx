import { memo } from "react";
import Image from "next/image";
import type { ChartBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";

interface ChartBlockProps {
  data: ChartBlockData;
}

const ChartBlock = ({ data }: ChartBlockProps) => {
  const chartTitle = data.title || (data.chartType ? `${data.chartType} chart` : "Chart");

  return (
    <InsightBlock title={chartTitle}>
      {data.imageUrl ? (
        <div className="overflow-hidden rounded-lg border border-[var(--chat-border)] bg-white p-2 dark:bg-slate-900">
          <Image
            src={data.imageUrl}
            alt={chartTitle}
            width={1200}
            height={675}
            className="h-auto w-full rounded-md"
            unoptimized
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--chat-border)] px-3 py-4 text-sm text-[var(--chat-muted)]">
          Chart config received. Rendering fallback used because no image URL was provided.
        </div>
      )}
    </InsightBlock>
  );
};

export default memo(ChartBlock);
