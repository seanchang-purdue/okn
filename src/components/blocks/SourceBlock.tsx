import { memo } from "react";
import type { SourceBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";

interface SourceBlockProps {
  data: SourceBlockData;
}

const SourceBlock = ({ data }: SourceBlockProps) => {
  return (
    <InsightBlock
      title={`Sources (${data.sources.length})`}
      collapsible
      defaultCollapsed
      className="bg-surface-2"
    >
      <ul className="m-0 list-disc space-y-1.5 pl-4 text-body text-ink-3">
        {data.sources.map((source, index) => (
          <li key={`${source.label}-${index}`}>
            <span className="font-medium text-ink-1">
              {source.label}
            </span>
            {source.detail ? <span className="ml-1">{source.detail}</span> : null}
          </li>
        ))}
      </ul>
    </InsightBlock>
  );
};

export default memo(SourceBlock);
