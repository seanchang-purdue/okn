"use client";

import { memo, useCallback, useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  artifactModalState,
  artifactModalActions,
} from "../../stores/artifactModalStore";
import type { InsightBlock } from "../../types/insight";
import { extractFirstHeading } from "../../utils/markdown";
import { BlockTypeIcon, type BlockTypeKey } from "../../icons/blockTypes";
import ReportRenderer from "../insight/ReportRenderer";
import { Button } from "@/components/ui/button";

/* ─── Icons ─────────────────────────────────────────────── */

const typeIconKeys: Record<string, BlockTypeKey> = {
  text: "text",
  chart: "chart",
  table: "table",
  comparison: "comparison",
};

/* ─── Copy button ───────────────────────────────────────── */

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [text]);

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? "Copied!" : label}
    </Button>
  );
}

/* ─── Title resolver ────────────────────────────────────── */

function getModalTitle(block: InsightBlock): string {
  switch (block.type) {
    case "text":
      return extractFirstHeading(block.data.markdown) ?? "Analysis";
    case "chart":
      return block.data.spec.title ?? "Chart";
    case "table":
      return block.data.caption ?? "Data Table";
    case "comparison":
      return "Comparison";
    case "callout":
      return block.data.title ?? "Insight";
    case "section":
      return block.data.heading;
    default:
      return "Content";
  }
}

/* ─── Modal ─────────────────────────────────────────────── */

const noop = () => {};

const ArtifactModal = () => {
  const { isOpen, block } = useStore(artifactModalState);

  if (!block) return null;

  const iconType = typeIconKeys[block.type] ?? "text";
  const title = getModalTitle(block);

  const metaParts: string[] = [];
  if (block.type === "text" && typeof block.meta?.confidence === "number") {
    metaParts.push(`${Math.round(block.meta.confidence * 100)}% confidence`);
  }
  if (block.meta?.caveats?.length) {
    metaParts.push(block.meta.caveats.join(" · "));
  }
  const metaText = metaParts.length > 0 ? metaParts.join(" · ") : undefined;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) artifactModalActions.close();
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-5xl">
        <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b border-border p-6 text-left">
          <div className="flex min-w-0 items-center gap-2.5">
            <BlockTypeIcon
              type={iconType}
              className="h-5 w-5 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg font-semibold text-foreground">
                {title}
              </DialogTitle>
              {metaText ? (
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  {metaText}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">
                  {title}
                </DialogDescription>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 pr-8">
            {block.type === "text" && (
              <CopyButton text={block.data.markdown} label="Copy" />
            )}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-4">
          {/* The expand view renders the same interactive report renderer
              at viewport width — no <img> charts, fully recursive. */}
          <ReportRenderer blocks={[block]} onSendMessage={noop} disabled />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ArtifactModal);
