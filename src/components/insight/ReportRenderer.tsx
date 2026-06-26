import { Fragment, type ReactNode } from "react";
import type {
  CalloutInsightBlock,
  InsightBlock,
} from "../../types/insight";
import TextBlock from "../blocks/TextBlock";
import StatBlock from "../blocks/StatBlock";
import ChartBlock from "../blocks/ChartBlock";
import TableBlock from "../blocks/TableBlock";
import ComparisonBlock from "../blocks/ComparisonBlock";
import MapActionBlock from "../blocks/MapActionBlock";
import SourceBlock from "../blocks/SourceBlock";
import FollowUpBlock from "../blocks/FollowUpBlock";
import CalloutBlock from "../blocks/CalloutBlock";
import SectionBlock from "../blocks/SectionBlock";
import RowBlock from "../blocks/RowBlock";

interface ReportRendererProps {
  blocks: InsightBlock[];
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

/**
 * Small "writing…" affordance shown beneath a streaming callout while its
 * markdown is still growing. (TextBlock renders its own blinking caret for
 * streaming prose, so prose does not need this wrapper.)
 */
const WritingIndicator = () => (
  <span className="mt-1 inline-flex items-center gap-1.5 text-caption text-ink-3">
    <span className="inline-block h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
    writing…
  </span>
);

/** Streaming callouts grow their markdown via deltas wherever they sit. */
const StreamingCallout = ({ block }: { block: CalloutInsightBlock }) => (
  <div>
    <CalloutBlock data={block.data} />
    {block.streaming && <WritingIndicator />}
  </div>
);

/**
 * The ONLY recursion site for the composed report tree. Walks a block list in
 * order and returns the matching component for each node. Layout containers
 * (section, row) recurse into their children; every other type is a leaf.
 */
function renderNode(
  block: InsightBlock,
  onSendMessage: (message: string) => void,
  disabled: boolean
): ReactNode {
  switch (block.type) {
    case "section":
      return (
        <SectionBlock data={block.data}>
          {block.data.children.map((child) => (
            <Fragment key={child.id}>
              {renderNode(child, onSendMessage, disabled)}
            </Fragment>
          ))}
        </SectionBlock>
      );
    case "row":
      return (
        <RowBlock data={block.data}>
          {block.data.children.map((child) => (
            <Fragment key={child.id}>
              {renderNode(child, onSendMessage, disabled)}
            </Fragment>
          ))}
        </RowBlock>
      );
    case "text":
      return (
        <TextBlock
          data={block.data}
          streaming={block.streaming}
          role={block.role}
          meta={block.meta}
        />
      );
    case "stat":
      return <StatBlock data={block.data} />;
    case "chart":
      return <ChartBlock data={block.data} />;
    case "table":
      return <TableBlock data={block.data} />;
    case "comparison":
      return <ComparisonBlock data={block.data} />;
    case "callout":
      return <StreamingCallout block={block} />;
    case "map-action":
      return <MapActionBlock data={block.data} />;
    case "source":
      return <SourceBlock data={block.data} />;
    case "follow-up":
      return (
        <FollowUpBlock
          data={block.data}
          onSelectSuggestion={onSendMessage}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
}

/**
 * Renders an agent turn as ONE flowing, interactive, sectioned document.
 * Top-level blocks are grouped under per-query accent-rail headers; nested
 * blocks flow inline via the recursive `renderNode`. No collapse-to-card.
 */
const ReportRenderer = ({
  blocks,
  onSendMessage,
  disabled,
}: ReportRendererProps) => {
  if (blocks.length === 0) return null;

  let previousQuery: string | undefined;
  const pieces: ReactNode[] = [];

  for (const block of blocks) {
    if (block.query && block.query !== previousQuery) {
      previousQuery = block.query;
      pieces.push(
        <section
          key={`query-${block.id}`}
          className="mt-4 border-l-2 border-accent py-0.5 pl-3 first:mt-0"
        >
          <p className="text-label">Query</p>
          <p className="mt-0.5 text-body font-medium text-ink-1">
            {block.query}
          </p>
        </section>
      );
    }

    pieces.push(
      <div key={`block-${block.id}`}>
        {renderNode(block, onSendMessage, disabled)}
      </div>
    );
  }

  return <div className="flex w-full flex-col gap-3">{pieces}</div>;
};

export default ReportRenderer;
