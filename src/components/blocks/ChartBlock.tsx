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
        <div className="overflow-hidden rounded-lg border border-line-1 bg-surface-1 p-2">
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
        <div className="rounded-lg border border-dashed border-line-1 px-3 py-4 text-body text-ink-3">
          Chart config received. Rendering fallback used because no image URL was provided.
        </div>
      )}
    </InsightBlock>
  );
};

export default memo(ChartBlock);
