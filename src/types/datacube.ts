// src/types/datacube.ts

// --- Schema endpoint ---

export interface DimensionInfo {
  name: string;
  type: "enum" | "integer" | "number";
  values?: (string | number)[];
}

export interface AggregationInfo {
  name: string;
  label: string;
  description: string;
}

export interface DatacubeSchemaResponse {
  dimensions: DimensionInfo[];
  filter_fields: DimensionInfo[];
  aggregations: AggregationInfo[];
}

// --- Query endpoint ---

export type FilterSpec =
  | { eq: string | number }
  | { in: (string | number)[] }
  | { range: [number, number] };

export interface DatacubeQueryRequest {
  row_dims: string[];
  col_dims: string[];
  filters?: Record<string, FilterSpec>;
  aggregation: string;
}

export interface DatacubeMeta {
  aggregation: string;
  row_dims: string[];
  col_dims: string[];
  total_rows: number;
  query_ms: number;
}

export interface DatacubeQueryResponse {
  rows: Record<string, string | number>[];
  meta: DatacubeMeta;
}

// --- UI types ---

export type DisplayMode = "table" | "bar" | "line";

export interface ActiveFilter {
  fieldName: string;
  spec: FilterSpec;
}
