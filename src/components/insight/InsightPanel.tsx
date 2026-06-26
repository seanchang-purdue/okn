import { useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { AnimatePresence, motion } from "framer-motion";
import { insightState } from "../../stores/insightStore";
import ReportRenderer from "./ReportRenderer";
import SuggestionChips from "../ui/SuggestionChips";

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
                <p className="text-label">
                  New analysis
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {contextLabel.split(" | ").map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-line-1 bg-surface-2 px-2.5 py-1 text-caption text-ink-2"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-caption text-ink-3">
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
                      className="flex w-full items-center justify-between gap-2 rounded-md border border-line-1 bg-surface-2 px-3 py-2 text-left text-body text-ink-1 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
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
              className="flex w-full flex-col gap-3"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <ReportRenderer
                blocks={blocks}
                onSendMessage={onSendMessage}
                disabled={disabled}
              />
              {showContextActions && (
                <section className="rounded-lg border border-line-1 bg-surface-1 px-4 py-3">
                  <p className="mb-2 text-caption font-medium text-ink-3">
                    Suggested follow-ups
                  </p>
                  <SuggestionChips
                    suggestions={contextualSuggestions.slice(0, 3)}
                    onSelect={onSelectContextSuggestion}
                    disabled={disabled || loading}
                  />
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
