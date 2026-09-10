export type InsightBlockType =
  | "text"
  | "stat"
  | "chart"
  | "table"
  | "comparison"
  | "map-action"
  | "source"
  | "follow-up"
  | "section"
  | "row"
  | "callout";

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
  unit?: string;
}

export type ChartKind =
  | "bar"
  | "line"
  | "multi_line"
  | "area"
  | "pie"
  | "scatter";

export interface ChartSpec {
  kind: ChartKind;
  xCol?: string; // column key in `data` rows
  yCols: string[]; // one or more series columns
  seriesCol?: string; // optional long-form series key
  stacked?: boolean;
  title?: string;
}

export interface ChartBlockData {
  spec: ChartSpec;
  data: { columns: string[]; rows: unknown[][] }; // trusted values from backend
  caption?: string;
}

export interface TableBlockData {
  columns: string[];
  rows: unknown[][];
  caption?: string;
}

export type CalloutTone = "info" | "warning" | "insight";

export interface CalloutBlockData {
  tone: CalloutTone;
  title?: string;
  markdown: string;
}

// Layout container. In the INSIGHT model children are already-normalized
// InsightBlock[] (on the wire they are ResponseBlockPayload[]).
export interface SectionBlockData {
  heading: string;
  level: 1 | 2;
  children: InsightBlock[];
}

// Layout container (side-by-side). `weights` are optional column weights;
// default equal when omitted.
export interface RowBlockData {
  children: InsightBlock[];
  weights?: number[];
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
  isArtifact?: boolean; // true only for blocks originating from response artifacts
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
export type SectionInsightBlock = InsightBlockBase<
  "section",
  SectionBlockData
>;
export type RowInsightBlock = InsightBlockBase<"row", RowBlockData>;
export type CalloutInsightBlock = InsightBlockBase<"callout", CalloutBlockData>;

export type InsightBlock =
  | TextInsightBlock
  | StatInsightBlock
  | ChartInsightBlock
  | TableInsightBlock
  | ComparisonInsightBlock
  | MapActionInsightBlock
  | SourceInsightBlock
  | FollowUpInsightBlock
  | SectionInsightBlock
  | RowInsightBlock
  | CalloutInsightBlock;

export function isArtifactBlock(block: InsightBlock): boolean {
  // Layout containers and callouts always render inline as document structure,
  // never as collapse-to-modal artifact cards.
  if (
    block.type === "section" ||
    block.type === "row" ||
    block.type === "callout"
  ) {
    return false;
  }
  if (block.type === "text" && (block.role === "plan" || block.role === "failure")) return false;
  // Text blocks are only artifacts when explicitly marked (from response artifacts).
  // Streamed key findings render inline as paragraphs.
  if (block.type === "text") return block.isArtifact === true;
  return ["chart", "table", "comparison"].includes(block.type);
}

export interface InsightState {
  blocks: InsightBlock[];
  loading: boolean;
  currentQuery: string | null;
}
