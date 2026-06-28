import { useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { insightState } from "../../stores/insightStore";
import ReportRenderer from "./ReportRenderer";
import SuggestionChips from "../ui/SuggestionChips";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
                    <Badge key={chip} variant="secondary" className="font-normal">
                      {chip}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-caption text-muted-foreground">
                  Coverage: Philadelphia, Chicago, New York City, Cincinnati ·
                  incident data with census and socioeconomic context
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {contextualSuggestions.map((suggestion, index) => (
                    <Button
                      key={`${suggestion.query}-${index}`}
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      onClick={() => onSelectContextSuggestion(suggestion.query)}
                      className="h-auto w-full justify-between px-3 py-2 text-left text-body font-normal whitespace-normal"
                    >
                      <span>{suggestion.label}</span>
                      <ArrowRight
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Button>
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
                <section className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="mb-2 text-caption font-medium text-muted-foreground">
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
