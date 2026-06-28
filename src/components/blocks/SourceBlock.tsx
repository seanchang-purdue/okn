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
      className="bg-muted"
    >
      <ul className="m-0 list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
        {data.sources.map((source, index) => (
          <li key={`${source.label}-${index}`}>
            <span className="font-medium text-foreground">
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
