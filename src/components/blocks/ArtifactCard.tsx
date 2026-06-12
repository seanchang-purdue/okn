import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { InsightBlock } from "../../types/insight";
import { stripMarkdown, extractFirstHeading, truncate } from "../../utils/markdown";
import { artifactModalActions } from "../../stores/artifactModalStore";

interface ArtifactCardProps {
  block: InsightBlock;
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

const ArtifactCard = ({ block }: ArtifactCardProps) => {
  const { icon, title, preview, badge, thumbnail } = useMemo(() => getCardContent(block), [block]);

  return (
    <motion.button
      type="button"
      onClick={() => artifactModalActions.open(block)}
      className="group flex w-full items-center gap-3 rounded-lg border border-line-1 bg-surface-1 px-4 py-3 text-left transition-colors hover:border-accent"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.997 }}
    >
      {/* Thumbnail for chart blocks */}
      {thumbnail ? (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-line-1">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-lg">
          {icon}
        </span>
      )}

      {/* Title + preview */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-body font-semibold text-ink-1">
            {title}
          </span>
          {badge && (
            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-caption font-medium text-ink-2">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-caption text-ink-3">
          {preview}
        </p>
      </div>

      {/* Arrow */}
      <span className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-accent">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </motion.button>
  );
};

export default memo(ArtifactCard);
