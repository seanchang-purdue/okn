import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useStore } from "@nanostores/react";
import { AnimatePresence, motion } from "framer-motion";
import { insightState } from "../../stores/insightStore";
import type { InsightBlock as InsightBlockModel } from "../../types/insight";
import { isArtifactBlock } from "../../types/insight";
import TextBlock from "../blocks/TextBlock";
import StatBlock from "../blocks/StatBlock";
import ChartBlock from "../blocks/ChartBlock";
import TableBlock from "../blocks/TableBlock";
import ComparisonBlock from "../blocks/ComparisonBlock";
import MapActionBlock from "../blocks/MapActionBlock";
import SourceBlock from "../blocks/SourceBlock";
import FollowUpBlock from "../blocks/FollowUpBlock";
import ArtifactCard from "../blocks/ArtifactCard";

interface InsightPanelProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  loading: boolean;
  connectionState: "connected" | "reconnecting" | "offline";
  contextLabel: string;
  contextualSuggestions: Array<{
    label: string;
    query: string;
  }>;
  onSelectContextSuggestion: (question: string) => void;
}

const renderInlineBlock = (
  block: InsightBlockModel,
  onSendMessage: (message: string) => void,
  disabled: boolean
) => {
  switch (block.type) {
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
};

const renderBlock = (
  block: InsightBlockModel,
  onSendMessage: (message: string) => void,
  disabled: boolean
) => {
  // Streaming blocks always render inline
  if (block.streaming) return renderInlineBlock(block, onSendMessage, disabled);

  // Artifact-eligible blocks render as compact cards
  if (isArtifactBlock(block)) {
    return <ArtifactCard block={block} />;
  }

  // Everything else inline
  return renderInlineBlock(block, onSendMessage, disabled);
};

const InsightPanel = ({
  onSendMessage,
  disabled,
  loading,
  connectionState,
  contextLabel,
  contextualSuggestions,
  onSelectContextSuggestion,
}: InsightPanelProps) => {
  const { blocks } = useStore(insightState);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [blocks, loading]);

  const hasBlocks = blocks.length > 0;
  const hasFollowUpBlock = blocks.some((block) => block.type === "follow-up");
  const showContextActions =
    hasBlocks &&
    !hasFollowUpBlock &&
    !loading &&
    connectionState !== "offline" &&
    contextualSuggestions.length > 0;

  const renderedBlocks = useMemo(() => {
    let previousQuery: string | undefined;

    return blocks.flatMap((block) => {
      const pieces: ReactNode[] = [];

      if (block.query && block.query !== previousQuery) {
        previousQuery = block.query;
        pieces.push(
          <section
            key={`query-${block.id}`}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              Query
            </p>
            <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">
              {block.query}
            </p>
          </section>
        );
      }

      pieces.push(<div key={`block-${block.id}`}>{renderBlock(block, onSendMessage, disabled)}</div>);

      return pieces;
    });
  }, [blocks, onSendMessage, disabled]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        <AnimatePresence mode="wait" initial={false}>
          {!hasBlocks ? (
            <motion.div
              key="empty-state"
              className="flex w-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <div className="w-full px-1 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  New analysis
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {contextLabel.split(" | ").map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[var(--chat-muted)]">
                  Coverage: Philadelphia, Chicago, New York City, Cincinnati ·
                  incident data with census and socioeconomic context
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {contextualSuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.query}-${index}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => onSelectContextSuggestion(suggestion.query)}
                      className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[13px] text-slate-800 transition-colors hover:border-[var(--chat-accent)] hover:text-[var(--chat-accent)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <span>{suggestion.label}</span>
                      <svg
                        className="h-3.5 w-3.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5 21 12l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="block-list"
              className="flex w-full flex-col gap-5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {renderedBlocks}
              {showContextActions && (
                <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="mb-2 text-xs font-medium text-[var(--chat-muted)]">
                    Suggested follow-ups
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contextualSuggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={`${suggestion.query}-${index}`}
                        type="button"
                        disabled={disabled || loading}
                        onClick={() => onSelectContextSuggestion(suggestion.query)}
                        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-[var(--chat-title)] transition-colors hover:border-[var(--chat-accent)] hover:text-[var(--chat-accent)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <div ref={endRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InsightPanel;
