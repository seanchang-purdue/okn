"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@heroui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import Image from "next/image";
import type { Components } from "react-markdown";
import { artifactModalState, artifactModalActions } from "../../stores/artifactModalStore";
import type {
  InsightBlock,
  TextInsightBlock,
  ChartInsightBlock,
  TableInsightBlock,
  ComparisonInsightBlock,
} from "../../types/insight";
import { extractFirstHeading } from "../../utils/markdown";
import "../../styles/notion-markdown.css";

/* ─── Icons ─────────────────────────────────────────────── */

const typeIcons: Record<string, string> = {
  text: "📄",
  chart: "📊",
  table: "📋",
  comparison: "⚖️",
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
      className="apple-notion-pill rounded-md px-2.5 py-1 text-xs font-medium transition-colors hover:border-[var(--chat-accent)] hover:text-[var(--chat-accent)]"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

/* ─── Download button ───────────────────────────────────── */

function DownloadButton({ url, filename }: { url: string; filename: string }) {
  return (
    <a
      href={url}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      className="apple-notion-pill rounded-md px-2.5 py-1 text-xs font-medium transition-colors hover:border-[var(--chat-accent)] hover:text-[var(--chat-accent)]"
    >
      Download
    </a>
  );
}

/* ─── Code block with copy ──────────────────────────────── */

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const lang = className?.replace("language-", "") ?? "";
  const code = String(children).replace(/\n$/, "");

  return (
    <div className="group relative">
      {lang && (
        <span className="absolute right-3 top-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {lang}
        </span>
      )}
      <pre className="!mt-0 !rounded-lg">
        <code className={className}>{code}</code>
      </pre>
      <div className="absolute right-2 top-8 opacity-0 transition-opacity group-hover:opacity-100">
        <CopyButton text={code} label="Copy" />
      </div>
    </div>
  );
}

/* ─── Markdown components override ─────────────────────── */

const mdComponents: Components = {
  code({ children, className, ...rest }) {
    const isBlock = className?.startsWith("language-") || false;
    if (isBlock) {
      return <CodeBlock className={className}>{children}</CodeBlock>;
    }
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    // Let CodeBlock handle wrapping
    return <>{children}</>;
  },
};

/* ─── Per-type content renderers ────────────────────────── */

function TextContent({ block }: { block: TextInsightBlock }) {
  return (
    <div className="notion-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={mdComponents}
      >
        {block.data.markdown}
      </ReactMarkdown>
    </div>
  );
}

function ChartContent({ block }: { block: ChartInsightBlock }) {
  const title = block.data.title ?? "Chart";

  if (!block.data.imageUrl) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--chat-border)] px-4 py-8 text-center text-sm text-[var(--chat-muted)]">
        No chart image available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--chat-border)] bg-white p-3 dark:bg-slate-900">
      <Image
        src={block.data.imageUrl}
        alt={title}
        width={1200}
        height={675}
        className="h-auto w-full rounded-md"
        unoptimized
      />
    </div>
  );
}

type SortDirection = "asc" | "desc";

const toDisplay = (value: unknown): string => {
  if (value === null || typeof value === "undefined") return "-";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
};

const toSortableValue = (value: unknown): string | number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
    return value.toLowerCase();
  }
  return toDisplay(value).toLowerCase();
};

function TableContent({ block }: { block: TableInsightBlock }) {
  const { columns, rows } = block.data;
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedRows = useMemo(() => {
    if (sortColumn === null) return rows;
    return [...rows].sort((a, b) => {
      const left = toSortableValue(a[sortColumn]);
      const right = toSortableValue(b[sortColumn]);
      if (left < right) return sortDirection === "asc" ? -1 : 1;
      if (left > right) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortColumn, sortDirection]);

  const handleSort = (colIdx: number) => {
    if (sortColumn !== colIdx) {
      setSortColumn(colIdx);
      setSortDirection("asc");
      return;
    }
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const csvText = useMemo(() => {
    const header = columns.join(",");
    const body = rows.map((row) => row.map((v) => `"${toDisplay(v)}"`).join(",")).join("\n");
    return `${header}\n${body}`;
  }, [columns, rows]);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <CopyButton text={csvText} label="Copy as CSV" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--chat-border)]">
        <table className="min-w-full border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-[var(--apple-notion-pill)]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col}
                  className="whitespace-nowrap border-b border-[var(--chat-border)] px-3 py-2.5 text-[13px] font-semibold text-[var(--chat-title)]"
                >
                  <button
                    type="button"
                    onClick={() => handleSort(idx)}
                    className="inline-flex items-center gap-1"
                  >
                    <span>{col}</span>
                    {sortColumn === idx && (
                      <span className="text-[10px] text-[var(--chat-muted)]">
                        {sortDirection === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIdx) => (
              <tr
                key={`row-${rowIdx}`}
                className={rowIdx % 2 === 0 ? "bg-transparent" : "bg-[var(--apple-notion-pill)]/55"}
              >
                {columns.map((_, cellIdx) => (
                  <td
                    key={`cell-${rowIdx}-${cellIdx}`}
                    className="whitespace-nowrap border-b border-[var(--chat-border)]/60 px-3 py-2 text-[13px] text-slate-700 dark:text-slate-200"
                  >
                    {toDisplay(row[cellIdx])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const valueTone = (value: string | number): string => {
  if (typeof value === "number") {
    if (value > 0) return "text-emerald-600 dark:text-emerald-400";
    if (value < 0) return "text-rose-600 dark:text-rose-400";
    return "text-slate-700 dark:text-slate-200";
  }
  const numericPrefix = Number(value.replace(/[^0-9+-.]/g, ""));
  if (Number.isFinite(numericPrefix)) {
    if (numericPrefix > 0 && value.trim().startsWith("+")) return "text-emerald-600 dark:text-emerald-400";
    if (numericPrefix < 0) return "text-rose-600 dark:text-rose-400";
  }
  return "text-slate-700 dark:text-slate-200";
};

function ComparisonContent({ block }: { block: ComparisonInsightBlock }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {block.data.items.map((item) => (
        <article
          key={item.label}
          className="rounded-lg border border-[var(--chat-border)] bg-[var(--apple-notion-pill)] p-4"
        >
          <h4 className="text-sm font-semibold text-[var(--chat-title)]">
            {item.label}
          </h4>
          <dl className="mt-3 space-y-2">
            {Object.entries(item.metrics).map(([metricLabel, metricValue]) => (
              <div key={metricLabel} className="flex items-center justify-between gap-3 text-[13px]">
                <dt className="text-[var(--chat-muted)]">{metricLabel}</dt>
                <dd className={`font-semibold ${valueTone(metricValue)}`}>{metricValue}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

/* ─── Title resolver ────────────────────────────────────── */

function getModalTitle(block: InsightBlock): string {
  switch (block.type) {
    case "text":
      return extractFirstHeading(block.data.markdown) ?? "Analysis";
    case "chart":
      return block.data.title ?? (block.data.chartType ? `${block.data.chartType} chart` : "Chart");
    case "table":
      return "Data Table";
    case "comparison":
      return "Comparison";
    default:
      return "Content";
  }
}

/* ─── Modal ─────────────────────────────────────────────── */

const ArtifactModal = () => {
  const { isOpen, block } = useStore(artifactModalState);

  if (!block) return null;

  const icon = typeIcons[block.type] ?? "📄";
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
                <span className="text-lg">{icon}</span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-[var(--chat-title)]">
                    {title}
                  </h2>
                  {metaText && (
                    <p className="mt-0.5 text-xs text-[var(--chat-muted)]">{metaText}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {block.type === "text" && (
                  <CopyButton text={block.data.markdown} label="Copy" />
                )}
                {block.type === "chart" && block.data.imageUrl && (
                  <DownloadButton url={block.data.imageUrl} filename={`${title}.png`} />
                )}
              </div>
            </ModalHeader>

            <ModalBody className="px-6 pb-8">
              {block.type === "text" && <TextContent block={block} />}
              {block.type === "chart" && <ChartContent block={block} />}
              {block.type === "table" && <TableContent block={block} />}
              {block.type === "comparison" && <ComparisonContent block={block} />}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default memo(ArtifactModal);
