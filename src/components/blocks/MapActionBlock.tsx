import { memo } from "react";
import type { MapActionBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";

interface MapActionBlockProps {
  data: MapActionBlockData;
}

const actionLabel: Record<MapActionBlockData["action"], string> = {
  flyTo: "Map moved",
  highlight: "Map highlighted",
  filter: "Map filtered",
  toggleLayer: "Layer updated",
};

const MapActionBlock = ({ data }: MapActionBlockProps) => {
  return (
    <InsightBlock className="py-3" meta={actionLabel[data.action]}>
      <div className="flex items-center gap-2 text-[13px] text-[var(--chat-muted)]">
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--chat-accent-soft)] text-[var(--chat-accent)]"
          aria-hidden="true"
        >
          ↗
        </span>
        <p className="m-0">Map updated — {data.description}</p>
      </div>
    </InsightBlock>
  );
};

export default memo(MapActionBlock);
