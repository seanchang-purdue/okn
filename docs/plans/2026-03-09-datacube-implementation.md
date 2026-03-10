# Data Cube Explorer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone `/datacube` page with a two-column pivot-table + chart explorer backed by `GET /api/v1/datacube/schema` and `POST /api/v1/datacube/query`.

**Architecture:** Left sidebar (320px) holds all controls (row/col dim pickers, aggregation dropdown, dynamic filters, run button). Right panel shows results as a pivot table or bar/line chart with auto-detection and manual tab override. All state lives in Nanostores atoms; schema is fetched once on mount; queries are triggered explicitly by the user.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS 4, HeroUI 2, Nanostores, Recharts 3, `@nanostores/react`

---

## Project conventions to follow

- Import API base URL helper: `import { apiUrl } from "../config/api"` → `apiUrl("/datacube/schema")`
- Nanostores: `import { atom } from "nanostores"` for non-persistent atoms; read in React with `import { useStore } from "@nanostores/react"`
- HeroUI components: `import { Button, Select, SelectItem, Chip, Tooltip } from "@heroui/react"`
- No test files in this project — use `pnpm build` to verify TypeScript compiles clean after each task
- All components are client components (`"use client"` at top) unless they are pure layout wrappers

---

## Task 1: TypeScript types

**Files:**
- Create: `src/types/datacube.ts`

**Step 1: Create the types file**

```typescript
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
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: No TypeScript errors related to `src/types/datacube.ts`

**Step 3: Commit**

```bash
git add src/types/datacube.ts
git commit -m "feat(datacube): add TypeScript types"
```

---

## Task 2: Nanostores

**Files:**
- Create: `src/stores/datacubeStore.ts`

**Step 1: Create the store**

```typescript
// src/stores/datacubeStore.ts
import { atom } from "nanostores";
import type {
  DatacubeSchemaResponse,
  DatacubeQueryResponse,
  DisplayMode,
  ActiveFilter,
} from "../types/datacube";

// Schema fetched once on mount
export const schemaStore = atom<DatacubeSchemaResponse | null>(null);

// Current query configuration
export const rowDimsStore = atom<string[]>([]);
export const colDimsStore = atom<string[]>([]);
export const aggregationStore = atom<string>("");
export const activeFiltersStore = atom<ActiveFilter[]>([]);

// Results from last query
export const resultsStore = atom<DatacubeQueryResponse | null>(null);

// UI state
export const loadingStore = atom<boolean>(false);
export const errorStore = atom<string | null>(null);
export const displayModeStore = atom<DisplayMode>("table");
// null = auto-detect, set to value when user manually picks
export const lockedModeStore = atom<DisplayMode | null>(null);
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Clean compile

**Step 3: Commit**

```bash
git add src/stores/datacubeStore.ts
git commit -m "feat(datacube): add Nanostores atoms"
```

---

## Task 3: Service layer

**Files:**
- Create: `src/services/datacubeService.ts`

**Step 1: Create the service**

```typescript
// src/services/datacubeService.ts
import { apiUrl } from "../config/api";
import type {
  DatacubeSchemaResponse,
  DatacubeQueryRequest,
  DatacubeQueryResponse,
} from "../types/datacube";

export class ValidationError extends Error {
  constructor(public detail: string) {
    super(detail);
    this.name = "ValidationError";
  }
}

export class QueryError extends Error {
  constructor(public detail: string) {
    super(detail);
    this.name = "QueryError";
  }
}

export async function fetchSchema(): Promise<DatacubeSchemaResponse> {
  const resp = await fetch(apiUrl("/datacube/schema"));
  if (!resp.ok) throw new Error("Failed to load datacube schema");
  return resp.json();
}

export async function queryDatacube(
  req: DatacubeQueryRequest
): Promise<DatacubeQueryResponse> {
  const resp = await fetch(apiUrl("/datacube/query"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (resp.status === 422) {
    const err = await resp.json();
    throw new ValidationError(err.detail ?? "Invalid selection");
  }
  if (resp.status === 400) {
    const err = await resp.json();
    throw new QueryError(
      err.detail ?? "Too many results — add more filters to narrow the data."
    );
  }
  if (!resp.ok) throw new Error("Server error");
  return resp.json();
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Clean compile

**Step 3: Commit**

```bash
git add src/services/datacubeService.ts
git commit -m "feat(datacube): add service layer (fetchSchema, queryDatacube)"
```

---

## Task 4: Pivot utility function

This is pure logic — no UI. Build it first so chart and table components can import it.

**Files:**
- Create: `src/utils/pivotRows.ts`

**Step 1: Create the utility**

```typescript
// src/utils/pivotRows.ts

export interface PivotResult {
  // Each entry is one visual row: rowDim values + colKey→value pairs
  tableRows: Record<string, string | number | null>[];
  // Unique values for each col_dim, in order
  colKeys: string[];
}

/**
 * Converts flat rows from the datacube API into a pivot-table structure.
 *
 * Flat row:  { city: "chicago", sex: "M", value: 21.3 }
 * After pivot (rowDims=["city"], colDims=["sex"]):
 *   tableRows: [{ city: "chicago", "M": 21.3, "F": 14.2, _total: 35.5 }]
 *   colKeys:   ["F", "M"]
 */
export function pivotRows(
  rows: Record<string, string | number>[],
  rowDims: string[],
  colDims: string[]
): PivotResult {
  if (rows.length === 0) return { tableRows: [], colKeys: [] };

  // If no col_dims, each flat row IS a table row
  if (colDims.length === 0) {
    const tableRows = rows.map((r) => ({ ...r, _total: r.value }));
    return { tableRows, colKeys: [] };
  }

  // Collect unique col keys (stringify multi-dim col combos)
  const colKeySet = new Set<string>();
  for (const row of rows) {
    colKeySet.add(colDims.map((d) => String(row[d])).join(" / "));
  }
  const colKeys = [...colKeySet].sort();

  // Group rows by row key
  const groups = new Map<string, Record<string, string | number | null>>();
  for (const row of rows) {
    const rowKey = rowDims.map((d) => String(row[d])).join("|");
    if (!groups.has(rowKey)) {
      const entry: Record<string, string | number | null> = {};
      for (const d of rowDims) entry[d] = row[d];
      for (const ck of colKeys) entry[ck] = null;
      entry._total = null;
      groups.set(rowKey, entry);
    }
    const colKey = colDims.map((d) => String(row[d])).join(" / ");
    const entry = groups.get(rowKey)!;
    entry[colKey] = row.value;
    entry._total = ((entry._total as number) ?? 0) + (row.value as number);
  }

  return { tableRows: [...groups.values()], colKeys };
}

/** Column totals row for the table footer */
export function computeColTotals(
  tableRows: Record<string, string | number | null>[],
  colKeys: string[]
): Record<string, number | null> {
  const totals: Record<string, number | null> = { _total: null };
  for (const ck of colKeys) {
    totals[ck] = tableRows.reduce((sum, r) => {
      const v = r[ck];
      return typeof v === "number" ? sum + v : sum;
    }, 0);
    if (totals[ck] !== null)
      totals._total = ((totals._total ?? 0) as number) + (totals[ck] as number);
  }
  return totals;
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Clean compile

**Step 3: Commit**

```bash
git add src/utils/pivotRows.ts
git commit -m "feat(datacube): add pivotRows utility"
```

---

## Task 5: Page route and layout

**Files:**
- Create: `src/app/datacube/layout.tsx`
- Create: `src/app/datacube/page.tsx`

**Step 1: Create the standalone layout**

This layout has its own minimal navbar (no map providers). It reuses `DarkmodeInitializer` and `Providers`.

```tsx
// src/app/datacube/layout.tsx
import type { Metadata } from "next";
import "../../styles/global.css";
import Providers from "../providers";
import DarkmodeInitializer from "../../components/utils/DarkmodeInitializer";

export const metadata: Metadata = {
  title: "OKN — Data Cube Explorer",
  description: "Explore gun violence data with pivot tables and charts",
};

export default function DatacubeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DarkmodeInitializer />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 2: Create the page entry**

```tsx
// src/app/datacube/page.tsx
import { Suspense } from "react";
import DataCubeApp from "../../components/datacube/DataCubeApp";

export default function DatacubePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-[var(--chat-bg)] flex items-center justify-center">
          <span className="text-foreground/50 text-sm">Loading…</span>
        </div>
      }
    >
      <DataCubeApp />
    </Suspense>
  );
}
```

**Step 3: Create the DataCubeApp stub** (will be fleshed out in Task 6, but must exist for the build to pass)

```tsx
// src/components/datacube/DataCubeApp.tsx
"use client";

export default function DataCubeApp() {
  return (
    <div className="h-screen flex items-center justify-center">
      <span>Data Cube Explorer — coming soon</span>
    </div>
  );
}
```

**Step 4: Verify build**

Run: `pnpm build`
Expected: Clean compile, new route `/datacube` exists

**Step 5: Commit**

```bash
git add src/app/datacube/layout.tsx src/app/datacube/page.tsx src/components/datacube/DataCubeApp.tsx
git commit -m "feat(datacube): add page route and layout stub"
```

---

## Task 6: ChartTypeSelector component

A small tab strip used in the results panel header.

**Files:**
- Create: `src/components/datacube/ChartTypeSelector.tsx`

**Step 1: Create the component**

```tsx
// src/components/datacube/ChartTypeSelector.tsx
"use client";

import type { DisplayMode } from "../../types/datacube";

interface Props {
  current: DisplayMode;
  autoDetected: DisplayMode;
  locked: boolean;
  onChange: (mode: DisplayMode) => void;
}

const MODES: { value: DisplayMode; label: string }[] = [
  { value: "table", label: "Table" },
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
];

export default function ChartTypeSelector({
  current,
  autoDetected,
  locked,
  onChange,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg border border-default-200 overflow-hidden">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={[
              "px-3 py-1 text-sm transition-colors",
              current === value
                ? "bg-primary text-primary-foreground"
                : "bg-content1 text-foreground hover:bg-content2",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
      {!locked && (
        <span className="text-xs text-foreground/40">
          Auto: {autoDetected === "line" ? "Line" : "Bar"}
        </span>
      )}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Clean compile

**Step 3: Commit**

```bash
git add src/components/datacube/ChartTypeSelector.tsx
git commit -m "feat(datacube): add ChartTypeSelector tab strip"
```

---

## Task 7: AggregationSelect component

**Files:**
- Create: `src/components/datacube/AggregationSelect.tsx`

**Step 1: Create the component**

```tsx
// src/components/datacube/AggregationSelect.tsx
"use client";

import { Select, SelectItem, Tooltip } from "@heroui/react";
import type { AggregationInfo } from "../../types/datacube";

interface Props {
  aggregations: AggregationInfo[];
  value: string;
  onChange: (name: string) => void;
}

export default function AggregationSelect({
  aggregations,
  value,
  onChange,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
        Aggregation
      </label>
      <Select
        size="sm"
        selectedKeys={value ? new Set([value]) : new Set()}
        onSelectionChange={(keys) => {
          const selected = [...keys][0] as string;
          if (selected) onChange(selected);
        }}
        aria-label="Aggregation function"
      >
        {aggregations.map((agg) => (
          <SelectItem key={agg.name} textValue={agg.label}>
            <Tooltip content={agg.description} placement="right">
              <span>{agg.label}</span>
            </Tooltip>
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Clean compile

**Step 3: Commit**

```bash
git add src/components/datacube/AggregationSelect.tsx
git commit -m "feat(datacube): add AggregationSelect component"
```

---

## Task 8: DimPicker component

Used for both Row Dimensions and Col Dimensions.

**Files:**
- Create: `src/components/datacube/DimPicker.tsx`

**Step 1: Create the component**

```tsx
// src/components/datacube/DimPicker.tsx
"use client";

import { useState } from "react";
import { Chip, Button, Listbox, ListboxItem, Popover, PopoverTrigger, PopoverContent, Input } from "@heroui/react";
import type { DimensionInfo } from "../../types/datacube";

interface Props {
  label: string;
  dimensions: DimensionInfo[];       // all available from schema
  selected: string[];                // currently selected in THIS picker
  otherSelected: string[];           // selected in the OTHER picker (to exclude)
  onChange: (dims: string[]) => void;
}

export default function DimPicker({
  label,
  dimensions,
  selected,
  otherSelected,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const available = dimensions.filter(
    (d) =>
      !selected.includes(d.name) &&
      !otherSelected.includes(d.name) &&
      d.name.toLowerCase().includes(search.toLowerCase())
  );

  const add = (name: string) => {
    onChange([...selected, name]);
    setSearch("");
    setOpen(false);
  };

  const remove = (name: string) => {
    onChange(selected.filter((d) => d !== name));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </label>

      <div className="flex flex-wrap gap-1 min-h-[32px]">
        {selected.map((name) => (
          <Chip
            key={name}
            size="sm"
            onClose={() => remove(name)}
            variant="flat"
            color="primary"
          >
            {name}
          </Chip>
        ))}
      </div>

      <Popover isOpen={open} onOpenChange={setOpen} placement="bottom-start">
        <PopoverTrigger>
          <Button
            size="sm"
            variant="flat"
            isDisabled={available.length === 0 && !search}
          >
            + Add dimension
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2 w-48">
          <Input
            size="sm"
            placeholder="Search…"
            value={search}
            onValueChange={setSearch}
            autoFocus
            className="mb-2"
          />
          {available.length === 0 ? (
            <p className="text-xs text-foreground/40 px-2 py-1">
              No dimensions available
            </p>
          ) : (
            <Listbox
              aria-label="Available dimensions"
              onAction={(key) => add(key as string)}
            >
              {available.map((d) => (
                <ListboxItem key={d.name}>{d.name}</ListboxItem>
              ))}
            </Listbox>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Clean compile

**Step 3: Commit**

```bash
git add src/components/datacube/DimPicker.tsx
git commit -m "feat(datacube): add DimPicker component"
```

---

## Task 9: FilterRow and FilterPanel components

**Files:**
- Create: `src/components/datacube/FilterRow.tsx`
- Create: `src/components/datacube/FilterPanel.tsx`

**Step 1: Create FilterRow**

```tsx
// src/components/datacube/FilterRow.tsx
"use client";

import { Button, Chip } from "@heroui/react";
import type { DimensionInfo, FilterSpec } from "../../types/datacube";

interface Props {
  field: DimensionInfo;
  spec: FilterSpec;
  onChange: (spec: FilterSpec) => void;
  onRemove: () => void;
}

export default function FilterRow({ field, spec, onChange, onRemove }: Props) {
  // Enum field → multi-select chips
  if (field.type === "enum" && field.values) {
    const selected =
      "in" in spec ? (spec.in as (string | number)[]) : [];

    const toggle = (v: string | number) => {
      const next = selected.includes(v)
        ? selected.filter((x) => x !== v)
        : [...selected, v];
      onChange({ in: next });
    };

    return (
      <div className="flex flex-col gap-1 py-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/70">{field.name}</span>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onRemove}
            aria-label="Remove filter"
          >
            ×
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {field.values.map((v) => (
            <Chip
              key={String(v)}
              size="sm"
              variant={selected.includes(v) ? "solid" : "flat"}
              color={selected.includes(v) ? "primary" : "default"}
              className="cursor-pointer"
              onClick={() => toggle(v)}
            >
              {String(v)}
            </Chip>
          ))}
        </div>
      </div>
    );
  }

  // Numeric field → range input
  const rangeSpec = "range" in spec ? spec.range : [0, 0];
  const [min, max] = rangeSpec as [number, number];
  const invalid = min > max;

  const updateRange = (index: 0 | 1, raw: string) => {
    const val = Number(raw);
    const next: [number, number] = index === 0 ? [val, max] : [min, val];
    onChange({ range: next });
  };

  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/70">{field.name}</span>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={onRemove}
          aria-label="Remove filter"
        >
          ×
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={min}
          onChange={(e) => updateRange(0, e.target.value)}
          className="w-20 px-2 py-1 text-sm rounded border border-default-200 bg-content1 text-foreground"
          placeholder="min"
        />
        <span className="text-foreground/40 text-xs">to</span>
        <input
          type="number"
          value={max}
          onChange={(e) => updateRange(1, e.target.value)}
          className="w-20 px-2 py-1 text-sm rounded border border-default-200 bg-content1 text-foreground"
          placeholder="max"
        />
      </div>
      {invalid && (
        <p className="text-xs text-danger">Min must be ≤ max</p>
      )}
    </div>
  );
}
```

**Step 2: Create FilterPanel**

```tsx
// src/components/datacube/FilterPanel.tsx
"use client";

import { useState } from "react";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Listbox,
  ListboxItem,
} from "@heroui/react";
import FilterRow from "./FilterRow";
import type { DimensionInfo, ActiveFilter, FilterSpec } from "../../types/datacube";

interface Props {
  filterFields: DimensionInfo[];
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
}

export default function FilterPanel({ filterFields, filters, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const activeNames = new Set(filters.map((f) => f.fieldName));
  const available = filterFields.filter((f) => !activeNames.has(f.name));

  const addFilter = (fieldName: string) => {
    const field = filterFields.find((f) => f.name === fieldName)!;
    const defaultSpec: FilterSpec =
      field.type === "enum" ? { in: [] } : { range: [0, 0] };
    onChange([...filters, { fieldName, spec: defaultSpec }]);
    setOpen(false);
  };

  const updateFilter = (index: number, spec: FilterSpec) => {
    const next = [...filters];
    next[index] = { ...next[index], spec };
    onChange(next);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
          Filters
          {filters.length > 0 && (
            <span className="ml-1 text-primary">{filters.length}</span>
          )}
        </label>
        <Popover isOpen={open} onOpenChange={setOpen} placement="bottom-end">
          <PopoverTrigger>
            <Button size="sm" variant="flat" isDisabled={available.length === 0}>
              + Add filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-48">
            <Listbox
              aria-label="Filter fields"
              onAction={(key) => addFilter(key as string)}
            >
              {available.map((f) => (
                <ListboxItem key={f.name}>{f.name}</ListboxItem>
              ))}
            </Listbox>
          </PopoverContent>
        </Popover>
      </div>

      {filters.map((f, i) => {
        const field = filterFields.find((ff) => ff.name === f.fieldName);
        if (!field) return null;
        return (
          <FilterRow
            key={f.fieldName}
            field={field}
            spec={f.spec}
            onChange={(spec) => updateFilter(i, spec)}
            onRemove={() => removeFilter(i)}
          />
        );
      })}
    </div>
  );
}
```

**Step 3: Verify build**

Run: `pnpm build`
Expected: Clean compile

**Step 4: Commit**

```bash
git add src/components/datacube/FilterRow.tsx src/components/datacube/FilterPanel.tsx
git commit -m "feat(datacube): add FilterRow and FilterPanel components"
```

---

## Task 10: ControlPanel component

Wires DimPicker, AggregationSelect, FilterPanel, and the Run Query button together.

**Files:**
- Create: `src/components/datacube/ControlPanel.tsx`

**Step 1: Create the component**

```tsx
// src/components/datacube/ControlPanel.tsx
"use client";

import { useStore } from "@nanostores/react";
import { Button } from "@heroui/react";
import DimPicker from "./DimPicker";
import AggregationSelect from "./AggregationSelect";
import FilterPanel from "./FilterPanel";
import {
  schemaStore,
  rowDimsStore,
  colDimsStore,
  aggregationStore,
  activeFiltersStore,
  loadingStore,
  resultsStore,
} from "../../stores/datacubeStore";
import type { ActiveFilter, FilterSpec } from "../../types/datacube";

interface Props {
  onRunQuery: () => void;
}

function hasInvalidFilter(filters: ActiveFilter[]): boolean {
  return filters.some((f) => {
    if ("range" in f.spec) {
      const [min, max] = f.spec.range;
      return min > max;
    }
    return false;
  });
}

export default function ControlPanel({ onRunQuery }: Props) {
  const schema = useStore(schemaStore);
  const rowDims = useStore(rowDimsStore);
  const colDims = useStore(colDimsStore);
  const aggregation = useStore(aggregationStore);
  const filters = useStore(activeFiltersStore);
  const loading = useStore(loadingStore);
  const results = useStore(resultsStore);

  if (!schema) return <div className="p-4 text-sm text-foreground/40">Loading schema…</div>;

  const noDims = rowDims.length === 0 && colDims.length === 0;
  const invalidFilter = hasInvalidFilter(filters);
  const canRun = !noDims && !invalidFilter && !loading;

  return (
    <aside className="w-80 flex-shrink-0 h-full overflow-y-auto border-r border-default-200 bg-content1 flex flex-col gap-5 p-4">
      <DimPicker
        label="Row Dimensions"
        dimensions={schema.dimensions}
        selected={rowDims}
        otherSelected={colDims}
        onChange={(dims) => rowDimsStore.set(dims)}
      />

      <DimPicker
        label="Col Dimensions"
        dimensions={schema.dimensions}
        selected={colDims}
        otherSelected={rowDims}
        onChange={(dims) => colDimsStore.set(dims)}
      />

      <AggregationSelect
        aggregations={schema.aggregations}
        value={aggregation}
        onChange={(name) => aggregationStore.set(name)}
      />

      <FilterPanel
        filterFields={schema.filter_fields}
        filters={filters}
        onChange={(f) => activeFiltersStore.set(f)}
      />

      <div className="mt-auto flex flex-col gap-1">
        <Button
          color="primary"
          isDisabled={!canRun}
          isLoading={loading}
          onPress={onRunQuery}
          fullWidth
        >
          Run Query
        </Button>
        {results && (
          <p className="text-xs text-center text-foreground/40">
            {results.meta.total_rows} rows · {results.meta.query_ms}ms
          </p>
        )}
        {noDims && (
          <p className="text-xs text-center text-warning">
            Select at least one dimension
          </p>
        )}
      </div>
    </aside>
  );
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Clean compile

**Step 3: Commit**

```bash
git add src/components/datacube/ControlPanel.tsx
git commit -m "feat(datacube): add ControlPanel component"
```

---

## Task 11: PivotTable component

**Files:**
- Create: `src/components/datacube/PivotTable.tsx`

**Step 1: Create the component**

```tsx
// src/components/datacube/PivotTable.tsx
"use client";

import { pivotRows, computeColTotals } from "../../utils/pivotRows";
import type { DatacubeQueryResponse } from "../../types/datacube";

interface Props {
  result: DatacubeQueryResponse;
}

function fmt(v: string | number | null): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}

export default function PivotTable({ result }: Props) {
  const { rows, meta } = result;
  const { tableRows, colKeys } = pivotRows(rows, meta.row_dims, meta.col_dims);
  const colTotals = computeColTotals(tableRows, colKeys);

  const showTotal = colKeys.length > 0;

  return (
    <div className="overflow-auto w-full h-full">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-content2 text-foreground/70">
            {meta.row_dims.map((d) => (
              <th
                key={d}
                className="px-3 py-2 text-left font-semibold sticky left-0 bg-content2 border-b border-default-200"
              >
                {d}
              </th>
            ))}
            {colKeys.map((ck) => (
              <th
                key={ck}
                className="px-3 py-2 text-right font-semibold border-b border-default-200"
              >
                {ck}
              </th>
            ))}
            {colKeys.length === 0 && (
              <th className="px-3 py-2 text-right font-semibold border-b border-default-200">
                Value
              </th>
            )}
            {showTotal && (
              <th className="px-3 py-2 text-right font-semibold border-b border-default-200 text-foreground/40">
                Total
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {tableRows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-default-100 hover:bg-content2/50 transition-colors"
            >
              {meta.row_dims.map((d) => (
                <td
                  key={d}
                  className="px-3 py-2 sticky left-0 bg-content1 font-medium"
                >
                  {fmt(row[d] as string | number | null)}
                </td>
              ))}
              {colKeys.length === 0 ? (
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmt(row.value as string | number | null)}
                </td>
              ) : (
                colKeys.map((ck) => (
                  <td key={ck} className="px-3 py-2 text-right tabular-nums">
                    {fmt(row[ck] as string | number | null)}
                  </td>
                ))
              )}
              {showTotal && (
                <td className="px-3 py-2 text-right tabular-nums text-foreground/50">
                  {fmt(row._total as number | null)}
                </td>
              )}
            </tr>
          ))}
        </tbody>

        {showTotal && (
          <tfoot>
            <tr className="bg-content2 font-semibold border-t-2 border-default-300">
              {meta.row_dims.map((d, i) => (
                <td key={d} className="px-3 py-2 sticky left-0 bg-content2">
                  {i === 0 ? "Total" : ""}
                </td>
              ))}
              {colKeys.map((ck) => (
                <td key={ck} className="px-3 py-2 text-right tabular-nums">
                  {fmt(colTotals[ck] as number | null)}
                </td>
              ))}
              <td className="px-3 py-2 text-right tabular-nums text-foreground/50">
                {fmt(colTotals._total as number | null)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Clean compile

**Step 3: Commit**

```bash
git add src/components/datacube/PivotTable.tsx
git commit -m "feat(datacube): add PivotTable component"
```

---

## Task 12: CubeChart component

**Files:**
- Create: `src/components/datacube/CubeChart.tsx`

**Step 1: Create the component**

Uses Recharts. Bar chart for categorical dims, line chart when a time dim is detected.

```tsx
// src/components/datacube/CubeChart.tsx
"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { pivotRows } from "../../utils/pivotRows";
import type { DatacubeQueryResponse, DisplayMode } from "../../types/datacube";

// Accessible color palette
const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6",
];

interface Props {
  result: DatacubeQueryResponse;
  mode: DisplayMode; // "bar" | "line"
}

export default function CubeChart({ result, mode }: Props) {
  const { rows, meta } = result;
  const { tableRows, colKeys } = pivotRows(rows, meta.row_dims, meta.col_dims);

  // X-axis key: join all row_dims into one label
  const xKey = "_rowLabel";
  const chartData = tableRows.map((row) => ({
    ...row,
    [xKey]: meta.row_dims.map((d) => String(row[d])).join(" / "),
  }));

  // Data series: colKeys if present, else "value"
  const seriesKeys = colKeys.length > 0 ? colKeys : ["value"];

  const commonProps = {
    data: chartData,
    margin: { top: 10, right: 20, left: 10, bottom: 60 },
  };

  const axisProps = {
    xAxis: (
      <XAxis
        dataKey={xKey}
        tick={{ fontSize: 11, fill: "var(--foreground)" }}
        angle={-35}
        textAnchor="end"
        interval={0}
      />
    ),
    yAxis: <YAxis tick={{ fontSize: 11, fill: "var(--foreground)" }} />,
    grid: <CartesianGrid strokeDasharray="3 3" stroke="var(--default-200)" />,
    tooltip: <Tooltip />,
    legend: seriesKeys.length > 1 ? <Legend /> : null,
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {mode === "line" ? (
        <LineChart {...commonProps}>
          {axisProps.grid}
          {axisProps.xAxis}
          {axisProps.yAxis}
          {axisProps.tooltip}
          {axisProps.legend}
          {seriesKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart {...commonProps}>
          {axisProps.grid}
          {axisProps.xAxis}
          {axisProps.yAxis}
          {axisProps.tooltip}
          {axisProps.legend}
          {seriesKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={COLORS[i % COLORS.length]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Clean compile

**Step 3: Commit**

```bash
git add src/components/datacube/CubeChart.tsx
git commit -m "feat(datacube): add CubeChart component (bar + line)"
```

---

## Task 13: ResultsPanel component

Wires ChartTypeSelector, PivotTable, CubeChart, and error/empty states.

**Files:**
- Create: `src/components/datacube/ResultsPanel.tsx`

**Step 1: Auto-detect helper (add to ResultsPanel file)**

```typescript
const TIME_DIMS = new Set(["year", "month", "season", "date", "week"]);

function autoDetectMode(rowDims: string[]): "bar" | "line" {
  return rowDims.some((d) => TIME_DIMS.has(d.toLowerCase())) ? "line" : "bar";
}
```

**Step 2: Create the component**

```tsx
// src/components/datacube/ResultsPanel.tsx
"use client";

import { useStore } from "@nanostores/react";
import {
  resultsStore,
  loadingStore,
  errorStore,
  displayModeStore,
  lockedModeStore,
  rowDimsStore,
} from "../../stores/datacubeStore";
import ChartTypeSelector from "./ChartTypeSelector";
import PivotTable from "./PivotTable";
import CubeChart from "./CubeChart";
import type { DisplayMode } from "../../types/datacube";

const TIME_DIMS = new Set(["year", "month", "season", "date", "week"]);

function autoDetectMode(rowDims: string[]): "bar" | "line" {
  return rowDims.some((d) => TIME_DIMS.has(d.toLowerCase())) ? "line" : "bar";
}

export default function ResultsPanel() {
  const results = useStore(resultsStore);
  const loading = useStore(loadingStore);
  const error = useStore(errorStore);
  const displayMode = useStore(displayModeStore);
  const lockedMode = useStore(lockedModeStore);
  const rowDims = useStore(rowDimsStore);

  const autoDetected = autoDetectMode(rowDims);
  const effectiveMode: DisplayMode = lockedMode ?? (displayMode === "table" ? "table" : autoDetected);

  const handleModeChange = (mode: DisplayMode) => {
    lockedModeStore.set(mode);
    displayModeStore.set(mode);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-default-200 bg-content1">
        <h2 className="text-sm font-semibold text-foreground/70">Results</h2>
        <ChartTypeSelector
          current={effectiveMode}
          autoDetected={autoDetected}
          locked={!!lockedMode}
          onChange={handleModeChange}
        />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="h-full flex items-center justify-center">
            <span className="text-foreground/40 text-sm animate-pulse">
              Running query…
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {!loading && !error && !results && (
          <div className="h-full flex items-center justify-center">
            <p className="text-foreground/30 text-sm text-center max-w-xs">
              Select dimensions and click Run Query to explore the data.
            </p>
          </div>
        )}

        {!loading && !error && results && (
          <div className="h-full">
            {effectiveMode === "table" ? (
              <PivotTable result={results} />
            ) : (
              <div style={{ height: "100%", minHeight: 320 }}>
                <CubeChart result={results} mode={effectiveMode} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `pnpm build`
Expected: Clean compile

**Step 4: Commit**

```bash
git add src/components/datacube/ResultsPanel.tsx
git commit -m "feat(datacube): add ResultsPanel with chart/table/error states"
```

---

## Task 14: DataCubeApp — master orchestrator

Replace the stub from Task 5 with the real orchestrator.

**Files:**
- Modify: `src/components/datacube/DataCubeApp.tsx`

**Step 1: Update the component**

```tsx
// src/components/datacube/DataCubeApp.tsx
"use client";

import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import Link from "next/link";
import DarkmodeButton from "../utils/DarkmodeButton";
import ControlPanel from "./ControlPanel";
import ResultsPanel from "./ResultsPanel";
import {
  schemaStore,
  rowDimsStore,
  colDimsStore,
  aggregationStore,
  activeFiltersStore,
  loadingStore,
  errorStore,
  resultsStore,
  lockedModeStore,
} from "../../stores/datacubeStore";
import { fetchSchema, queryDatacube, ValidationError, QueryError } from "../../services/datacubeService";
import type { FilterSpec } from "../../types/datacube";

export default function DataCubeApp() {
  const schema = useStore(schemaStore);

  // Fetch schema on mount
  useEffect(() => {
    fetchSchema()
      .then((s) => {
        schemaStore.set(s);
        // Default aggregation to first option
        if (s.aggregations.length > 0) {
          aggregationStore.set(s.aggregations[0].name);
        }
      })
      .catch(() => {
        errorStore.set("Failed to load schema. Please refresh.");
      });
  }, []);

  const handleRunQuery = async () => {
    const rowDims = rowDimsStore.get();
    const colDims = colDimsStore.get();
    const aggregation = aggregationStore.get();
    const activeFilters = activeFiltersStore.get();

    loadingStore.set(true);
    errorStore.set(null);
    // Reset locked mode so auto-detect runs fresh
    lockedModeStore.set(null);

    // Build filters record
    const filters: Record<string, FilterSpec> = {};
    for (const f of activeFilters) {
      // Skip empty enum filters
      if ("in" in f.spec && (f.spec.in as (string | number)[]).length === 0) continue;
      filters[f.fieldName] = f.spec;
    }

    try {
      const result = await queryDatacube({
        row_dims: rowDims,
        col_dims: colDims,
        aggregation,
        ...(Object.keys(filters).length > 0 ? { filters } : {}),
      });
      resultsStore.set(result);
    } catch (err) {
      if (err instanceof ValidationError) {
        errorStore.set(`Invalid selection: ${err.detail}`);
      } else if (err instanceof QueryError) {
        errorStore.set("Too many results — add more filters to narrow the data.");
      } else {
        errorStore.set("Something went wrong. Try again.");
      }
    } finally {
      loadingStore.set(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--chat-bg)]">
      {/* Navbar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-default-200 bg-content1 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-foreground/50 hover:text-foreground transition-colors">
            ← Map
          </Link>
          <h1 className="font-semibold text-foreground">Data Cube Explorer</h1>
        </div>
        <DarkmodeButton />
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <ControlPanel onRunQuery={handleRunQuery} />
        <ResultsPanel />
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Clean compile, no errors

**Step 3: Smoke test manually**

Run: `pnpm dev`
Navigate to: `http://localhost:4321/datacube`
Expected:
- Page loads with two-column layout
- Navbar shows "Data Cube Explorer" + "← Map" link + dark mode button
- Left sidebar shows "Loading schema…" (until backend is up) or dim pickers
- Right panel shows "Select dimensions and click Run Query…"
- Dark mode toggle works

**Step 4: Commit**

```bash
git add src/components/datacube/DataCubeApp.tsx
git commit -m "feat(datacube): wire up DataCubeApp orchestrator — datacube page complete"
```

---

## Done

The feature is complete when:
- `pnpm build` passes with no TypeScript errors
- Navigating to `/datacube` shows the two-column layout
- Schema loads from `GET /api/v1/datacube/schema` and populates all pickers
- Selecting dims + clicking Run Query calls `POST /api/v1/datacube/query`
- Results render as a pivot table or chart based on auto-detection
- Chart type tabs override auto-detection
- Error states show for 422, 400, 500
