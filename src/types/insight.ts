export type InsightBlockType =
  | "text"
  | "stat"
  | "chart"
  | "table"
  | "comparison"
  | "map-action"
  | "source"
  | "follow-up";

export type SemanticBlockType =
  | "plan"
  | "finding"
  | "map_action"
  | "evidence"
  | "follow_up"
  | "failure";

export type TextBlockRole = "plan" | "finding" | "failure";

export interface InsightSourceRef {
  label?: string;
  detail?: string;
  url?: string;
}

export interface InsightBlockMeta {
  confidence?: number; // 0..1
  caveats?: string[];
  sourceRefs?: InsightSourceRef[];
}

export interface TextBlockData {
  markdown: string;
}

export interface StatBlockData {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
}

export interface ChartBlockData {
  chartType: string;
  config?: unknown;
  imageUrl?: string;
  title?: string;
}

export interface TableBlockData {
  columns: string[];
  rows: unknown[][];
}

export interface ComparisonBlockData {
  items: Array<{
    label: string;
    metrics: Record<string, string | number>;
  }>;
}

export interface MapActionBlockData {
  action: "flyTo" | "highlight" | "filter" | "toggleLayer";
  params: Record<string, unknown>;
  description: string;
}

export interface SourceBlockData {
  sources: Array<{
    label: string;
    detail?: string;
  }>;
}

export interface FollowUpBlockData {
  suggestions: Array<{
    label: string;
    query: string;
    icon?: string;
  }>;
}

interface InsightBlockBase<TType extends InsightBlockType, TData> {
  id: string;
  type: TType;
  data: TData;
  timestamp: number;
  streaming: boolean;
  query?: string;
  semanticType?: SemanticBlockType;
  role?: TextBlockRole;
  meta?: InsightBlockMeta;
}

export type TextInsightBlock = InsightBlockBase<"text", TextBlockData>;
export type StatInsightBlock = InsightBlockBase<"stat", StatBlockData>;
export type ChartInsightBlock = InsightBlockBase<"chart", ChartBlockData>;
export type TableInsightBlock = InsightBlockBase<"table", TableBlockData>;
export type ComparisonInsightBlock = InsightBlockBase<
  "comparison",
  ComparisonBlockData
>;
export type MapActionInsightBlock = InsightBlockBase<
  "map-action",
  MapActionBlockData
>;
export type SourceInsightBlock = InsightBlockBase<"source", SourceBlockData>;
export type FollowUpInsightBlock = InsightBlockBase<
  "follow-up",
  FollowUpBlockData
>;

export type InsightBlock =
  | TextInsightBlock
  | StatInsightBlock
  | ChartInsightBlock
  | TableInsightBlock
  | ComparisonInsightBlock
  | MapActionInsightBlock
  | SourceInsightBlock
  | FollowUpInsightBlock;

export function isArtifactBlock(block: InsightBlock): boolean {
  if (block.type === "text" && (block.role === "plan" || block.role === "failure")) return false;
  return ["text", "chart", "table", "comparison"].includes(block.type);
}

export interface InsightState {
  blocks: InsightBlock[];
  loading: boolean;
  currentQuery: string | null;
}
