# Data Cube Explorer — Frontend Design

**Date:** 2026-03-09
**Status:** Approved
**Scope:** Standalone pivot-table UI for the `/api/v1/datacube` REST endpoints

---

## Overview

A standalone page at `/datacube` for exploring aggregated gun violence data via a pivot table + chart interface. Completely independent of the main chat/map page — no shared WebSocket, no shared stores.

---

## Backend API Contract

Two REST endpoints (no WebSocket):

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/datacube/schema` | GET | Fetch dimensions, filter fields, aggregation options |
| `/api/v1/datacube/query` | POST | Execute pivot query, returns flat rows + metadata |

Key types (see `src/types/datacube.ts`):
- `DimensionInfo` — `{ name, type: "enum"|"integer"|"number", values? }`
- `AggregationInfo` — `{ name, label, description }`
- `DatacubeSchemaResponse` — `{ dimensions, filter_fields, aggregations }`
- `DatacubeQueryRequest` — `{ row_dims, col_dims, filters?, aggregation }`
- `DatacubeQueryResponse` — `{ rows, meta }`

---

## Architecture

### File Structure

```
src/app/datacube/
├── page.tsx                  # entry, wraps DataCubeApp in Suspense
└── layout.tsx                # standalone layout (own navbar, no map providers)

src/components/datacube/
├── DataCubeApp.tsx           # master orchestrator (schema fetch, query state)
├── ControlPanel.tsx          # left sidebar — dims, filters, aggregation, run button
├── DimPicker.tsx             # reusable row/col dimension selector
├── FilterPanel.tsx           # dynamic filter list
├── FilterRow.tsx             # single filter (enum multi-select or range input)
├── AggregationSelect.tsx     # aggregation dropdown with tooltip
├── ResultsPanel.tsx          # right area — tabs + chart/table
├── PivotTable.tsx            # flat rows → rendered pivot table
├── CubeChart.tsx             # Recharts bar/line with auto-detect + override
└── ChartTypeSelector.tsx     # [Table] [Bar] [Line] tab strip

src/services/datacubeService.ts   # fetchSchema(), queryDatacube()
src/types/datacube.ts             # all TS types from the API spec
src/stores/datacubeStore.ts       # Nanostores atoms
```

### State (Nanostores atoms in `datacubeStore.ts`)

| Atom | Type | Purpose |
|---|---|---|
| `schemaStore` | `DatacubeSchemaResponse \| null` | Schema loaded on mount |
| `queryParamsStore` | `{ rowDims, colDims, filters, aggregation }` | Current query config |
| `resultsStore` | `DatacubeQueryResponse \| null` | Last query result |
| `uiStore` | `{ loading, error, displayMode, autoDetected }` | UI state |

`displayMode`: `'table' | 'bar' | 'line'`
`autoDetected`: the chart type the heuristic would pick (`'bar' | 'line'`)

---

## Layout

Two-column: 320px fixed left sidebar (controls) + flex-1 right panel (results).

```
┌─────────────────────────────────────────────────────────────────┐
│  Data Cube Explorer                     [dark mode] [← Map]     │
├──────────────────────┬──────────────────────────────────────────┤
│  CONTROLS  (320px)   │  RESULTS                                 │
│                      │                                          │
│  Row Dimensions      │  [Table] [Bar] [Line]   Auto: Line       │
│  [+ Add dim]         │                                          │
│  ┌───────────┐       │  ┌────────────────────────────────────┐  │
│  │ city  ×   │       │  │  chart / table renders here        │  │
│  └───────────┘       │  └────────────────────────────────────┘  │
│                      │                                          │
│  Col Dimensions      │  48 rows · 34ms                          │
│  [+ Add dim]         │                                          │
│  ┌───────────┐       │                                          │
│  │ sex   ×   │       │                                          │
│  └───────────┘       │                                          │
│                      │                                          │
│  Aggregation         │                                          │
│  [Fatality Rate ▾]   │                                          │
│                      │                                          │
│  Filters             │                                          │
│  [+ Add filter]      │                                          │
│  city: philly, chi   │                                          │
│  year: 2019–2023     │                                          │
│                      │                                          │
│  [Run Query]         │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

---

## Control Panel UX

### Dimension Pickers (Row / Col)
- Populated from `schema.dimensions`
- Searchable dropdown; dims already selected in either picker are hidden
- Selected dims render as removable pills, draggable to reorder
- Query button disabled if both row_dims and col_dims are empty

### Aggregation
- Dropdown from `schema.aggregations`, displays `label`, sends `name`
- Hover on ⓘ icon shows `description` tooltip
- Default: first aggregation in schema

### Filters
- `[+ Add filter]` opens dropdown of `schema.filter_fields`
- Each FilterRow renders based on field type:
  - **enum** → multi-select chip input (uses `field.values`)
  - **integer / number** → two number inputs (min / max), inline validation `min ≤ max`
- Removable with ×
- Active filter count badge on section header

### Run Query Button
- Disabled when: no dims selected, or any range filter has min > max
- Spinner while loading
- Shows `{total_rows} rows · {query_ms}ms` below after success

---

## Results Panel UX

### Chart Type Auto-Detection

```
if displayMode === 'table'           → PivotTable
if user manually selected Bar/Line   → use that (locked)
else (auto):
  if row_dims includes 'year' | 'month' | 'season'  → Line
  else                                               → Bar
```

- Auto badge: `Auto: Line` shown in results header
- `[Table] [Bar] [Line]` tab strip for override
- Locking: once user clicks a tab, badge disappears; resets to auto on next query run

### CubeChart (Recharts)
- **Bar:** grouped when col_dims non-empty (bar group per row key, bar per col value); single bar when no col_dims
- **Line:** X-axis = time dim, one `<Line>` per col_dim value (or single line)
- Legend when col_dims non-empty
- Responsive container, dark-mode via CSS vars

### PivotTable
- Header: row dim labels + col_dim value columns + "Total" (row sum)
- Body: one row per unique row_dim combo; empty cells → `—`; values formatted to 2dp
- Sticky first column; horizontal scroll for wide column sets
- "Total" footer row (column sums)

### Empty State
Before first query: *"Select dimensions and click Run Query to explore the data."*

### Error States (inline in results panel)
| HTTP | Message |
|---|---|
| 422 | `"Invalid selection: <detail>"` |
| 400 | `"Too many results — add more filters to narrow the data."` |
| 500 | `"Something went wrong. Try again."` + retry button |

---

## Out of Scope (v1)

- Rate per 100k population
- Socioeconomic filters (income, poverty rate)
- CSV/Excel export
- Result caching
