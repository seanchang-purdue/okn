"use client";

import { memo, useCallback, useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@heroui/react";
import {
  artifactModalState,
  artifactModalActions,
} from "../../stores/artifactModalStore";
import type { InsightBlock } from "../../types/insight";
import { extractFirstHeading } from "../../utils/markdown";
import { BlockTypeIcon, type BlockTypeKey } from "../../icons/blockTypes";
import ReportRenderer from "../insight/ReportRenderer";

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
    <button
      type="button"
      onClick={handleCopy}
      className="apple-notion-pill rounded-md px-2.5 py-1 text-caption font-medium transition-colors hover:border-accent hover:text-accent"
    >
      {copied ? "Copied!" : label}
    </button>
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
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) artifactModalActions.close();
      }}
      size="5xl"
      backdrop="opaque"
      scrollBehavior="inside"
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <BlockTypeIcon
                  type={iconType}
                  className="h-5 w-5 shrink-0 text-ink-3"
                />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-ink-1">
                    {title}
                  </h2>
                  {metaText && (
                    <p className="mt-0.5 text-caption text-ink-3">{metaText}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {block.type === "text" && (
                  <CopyButton text={block.data.markdown} label="Copy" />
                )}
              </div>
            </ModalHeader>

            <ModalBody className="px-6 pb-8">
              {/* The expand view renders the same interactive report renderer
                  at viewport width — no <img> charts, fully recursive. */}
              <ReportRenderer
                blocks={[block]}
                onSendMessage={noop}
                disabled
              />
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default memo(ArtifactModal);
