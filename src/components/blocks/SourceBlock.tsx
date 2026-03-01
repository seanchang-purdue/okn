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
      className="bg-[var(--apple-notion-pill)]"
    >
      <ul className="m-0 list-disc space-y-1.5 pl-4 text-[13px] text-[var(--chat-muted)]">
        {data.sources.map((source, index) => (
          <li key={`${source.label}-${index}`}>
            <span className="font-medium text-[var(--chat-title)] dark:text-slate-100">
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
