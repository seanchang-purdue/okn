import { memo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { InsightBlock } from "../../types/insight";
import { stripMarkdown, extractFirstHeading, truncate } from "../../utils/markdown";

interface ArtifactCardProps {
  block: InsightBlock;
  onClick: () => void;
}

const typeConfig: Record<
  string,
  { icon: string; defaultTitle: string }
> = {
  text: { icon: "📄", defaultTitle: "Analysis" },
  chart: { icon: "📊", defaultTitle: "Chart" },
  table: { icon: "📋", defaultTitle: "Data Table" },
  comparison: { icon: "⚖️", defaultTitle: "Comparison" },
};

function getCardContent(block: InsightBlock) {
  const config = typeConfig[block.type] ?? { icon: "📄", defaultTitle: "Content" };

  switch (block.type) {
    case "text": {
      const heading = extractFirstHeading(block.data.markdown);
      const preview = truncate(stripMarkdown(block.data.markdown), 120);
      const confidence =
        typeof block.meta?.confidence === "number"
          ? `${Math.round(block.meta.confidence * 100)}%`
          : undefined;
      return {
        icon: config.icon,
        title: heading ?? config.defaultTitle,
        preview,
        badge: confidence,
        thumbnail: undefined as string | undefined,
      };
    }
    case "chart": {
      const title = block.data.title ?? (block.data.chartType ? `${block.data.chartType} chart` : config.defaultTitle);
      return {
        icon: config.icon,
        title,
        preview: "Click to view full chart",
        badge: block.data.chartType ?? undefined,
        thumbnail: block.data.imageUrl,
      };
    }
    case "table": {
      const colCount = block.data.columns.length;
      const rowCount = block.data.rows.length;
      return {
        icon: config.icon,
        title: config.defaultTitle,
        preview: `${colCount} columns, ${rowCount} rows`,
        badge: `${rowCount} rows`,
        thumbnail: undefined,
      };
    }
    case "comparison": {
      const labels = block.data.items.slice(0, 2).map((i) => i.label).join(" vs ");
      return {
        icon: config.icon,
        title: config.defaultTitle,
        preview: labels || "View comparison",
        badge: `${block.data.items.length} items`,
        thumbnail: undefined,
      };
    }
    default:
      return {
        icon: config.icon,
        title: config.defaultTitle,
        preview: "",
        badge: undefined,
        thumbnail: undefined,
      };
  }
}

const ArtifactCard = ({ block, onClick }: ArtifactCardProps) => {
  const { icon, title, preview, badge, thumbnail } = getCardContent(block);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-[var(--chat-accent)] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-[var(--chat-accent)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.997 }}
    >
      {/* Thumbnail for chart blocks */}
      {thumbnail ? (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-lg dark:bg-slate-800">
          {icon}
        </span>
      )}

      {/* Title + preview */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </span>
          {badge && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-[var(--chat-muted)]">
          {preview}
        </p>
      </div>

      {/* Arrow */}
      <span className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--chat-accent)] dark:text-slate-500">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </motion.button>
  );
};

export default memo(ArtifactCard);
