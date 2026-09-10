# OKN Composed-Report — Frontend Integration Spec

**Date:** 2026-06-26
**Target repo:** `okn` (Next.js App Router, nanostores, mapbox-gl, react-markdown)
**Companion:** backend design `2026-06-26-okn-composed-report-output-design.md` (in `okn-chatbot`).
**Branch suggestion:** `seanchang/composed-report` (frontend), shipped in lockstep with the backend branch.

This spec tells the frontend exactly what to build and change so an agent turn renders as **one composed, interactive, sectioned report** (charts + layout + explanation woven together) plus a short streamed **summary** in the chat bubble. The backend emits the existing `event` protocol with an **extended block vocabulary**; the frontend adapts its renderers. Per owner direction, the frontend may refactor freely to match this contract.

---

## 1. What changes, in one paragraph

The transport envelope (`{type:"event", payload:{type, data}}`) and the four protocol events (`block.stream.delta`, `block.emitted`, `response.completed`, `response.error`) **stay**. Three things change inside them: (1) **charts become data-driven** — `data` carries `{spec, data:{columns, rows}}` and is rendered with a real chart library, *replacing* the `imageUrl` `<img>` path; (2) **new layout/content block types** appear — `section`, `row`, `callout`; (3) the panel renders blocks as **one cohesive report document** (sections, headings, side-by-side rows, inline charts/tables/prose) instead of scattered artifact cards. The chat bubble shows only the streamed `summary`.

## 2. Wire contract the frontend must accept (authoritative)

All messages remain `{ type, payload, metadata? }`. Agent protocol uses `type:"event"`, `payload: AgentEventPayload = { requestId?, type, ts?, data? }`. Relevant events:

### 2.1 `block.emitted` — structure + atomic blocks
`data` is `{ messageId, blocks: ResponseBlockPayload[] }` (or `{block}` singular). The backend sends **one** `block.emitted` carrying the **resolved report tree** at turn start: layout containers populated, charts/tables/stats filled with trusted data, prose/callout blocks present with `streaming:true` and empty markdown.

Each block: `{ id, type, data, streaming?, query?, semanticType?, role?, meta? }`. **New/changed block types and their `data`:**

```ts
// CHANGED — chart no longer uses imageUrl
interface ChartBlockData {
  spec: {
    kind: "bar" | "line" | "multi_line" | "area" | "pie" | "scatter";
    xCol?: string;            // column key in `data` rows
    yCols: string[];          // one or more series columns
    seriesCol?: string;       // optional long-form series key
    stacked?: boolean;
    title?: string;
  };
  data: { columns: string[]; rows: unknown[][] };  // trusted values from backend
  caption?: string;
  // NOTE: `imageUrl` is gone. Render from spec+data.
}

// NEW
interface CalloutBlockData {
  tone: "info" | "warning" | "insight";
  title?: string;
  markdown: string;
}

// NEW — layout container
interface SectionBlockData {
  heading: string;
  level: 1 | 2;
  children: ResponseBlockPayload[];   // nested blocks (and rows)
}

// NEW — layout container (side-by-side)
interface RowBlockData {
  children: ResponseBlockPayload[];   // content blocks only
  weights?: number[];                 // optional column weights; default equal
}
```

Unchanged block data shapes (keep as-is): `TextBlockData{markdown}`, `TableBlockData{columns, rows}` (+ optional `caption`), `StatBlockData{label, value, delta?, deltaLabel?, unit?}`, `MapActionBlockData{action, params, description}`, `SourceBlockData{sources}`, `FollowUpBlockData{suggestions}`.

### 2.2 `block.stream.delta` — narrative fill-in
`data` is `{ blockId, delta, isComplete? }` (the normalizer accepts `blockId`/`messageId`/`id` and `delta`/`chunk`). Each delta **grows the markdown of the prose/callout block whose id matches `blockId`**, *wherever it sits in the report tree* (including nested in a section/row). The summary streams under its own `messageId` into the chat bubble.

> **Frontend change:** today `block.stream.delta` only grows a *top-level* text block (`applyStreamPayload`, `websocketStore.ts:305-405`). It must be generalized to update a block by id **anywhere in the tree** (and to grow `callout` markdown, not just `text`).

### 2.3 `response.completed` / `response.error` — unchanged semantics
`response.completed.data`: `{ messageId, quickActions?, blocks?, ... }`. `response.error.data`: `{ code, message, retryable }` with `code` in the existing allowed set. Keep current handling.

### 2.4 Status/lifecycle events — unchanged
`request.accepted`, `route.selected`, `plan.*`, `tool.*`, `synthesis.started` → `StatusStage` via `AGENT_EVENT_STAGE_MAP`. No change.

## 3. Block model changes (`src/types/insight.ts`)

- Extend `InsightBlockType` with `"section" | "row" | "callout"`.
- Add `SectionBlockData`, `RowBlockData`, `CalloutBlockData` (§2.1) and their `InsightBlock` union members.
- **Replace** `ChartBlockData` (`{chartType, config?, imageUrl?, title?}`) with the data-driven shape (§2.1). The dead `imageUrl`/`config` fields are removed; any code reading them is updated.
- `isArtifactBlock`: layout containers (`section`/`row`) are **not** artifact cards — they render inline as document structure. Keep `chart`/`table`/`comparison` artifact behavior only if you retain the modal expand affordance (see §5).

## 4. Wire normalization changes (`src/utils/websocket.ts`)

- `FRONTEND_BLOCK_TYPES` / `toWireType`: add `section`, `row`, `callout` as first-class frontend types (no semantic remap needed; backend already emits these exact strings).
- `normalizeResponseBlocks` (`websocket.ts:584-630`): for `section`/`row`, recursively normalize `data.children` (they are themselves `ResponseBlockPayload[]`). For `chart`, pass `data` through verbatim (it now carries `{spec, data}`); drop the old `imageUrl` assumptions. For `callout`, pass through.
- `normalizeAgentStreamPayload` (`websocket.ts:668-702`): already keys on `blockId`/`messageId`/`id` and accepts `delta`/`chunk` — **no change needed**; just ensure the store's delta application (below) targets nested blocks.

## 5. Rendering — the composed report

- **New** `ReportRenderer` (or extend `InsightPanel`, `src/components/insight/InsightPanel.tsx`): render the block list as **one flowing document**, not a stack of cards. Walk the tree: `section` → a titled group (heading at `level`); `row` → a CSS grid/flex row honoring `weights`; content blocks render inline inside their container.
- **New** `ChartBlock` (rewrite `src/components/blocks/ChartBlock.tsx`): render with a real chart library (**Recharts** recommended — composable, SSR-friendly, themeable via your design tokens). Map `spec.kind` → component: `bar`→`<BarChart>`, `line`/`multi_line`→`<LineChart>`, `area`→`<AreaChart>`, `pie`→`<PieChart>`, `scatter`→`<ScatterChart>`. Feed series from `data.columns`/`data.rows` using `spec.xCol`/`yCols`/`seriesCol`/`stacked`. Interactive tooltips, legend toggle, responsive container. Title from `spec.title`; `caption` below.
- **New** `CalloutBlock`: a toned box (`info`/`warning`/`insight`) rendering `markdown` via the existing react-markdown setup (+ `rehype-sanitize`).
- **Reuse** `TableBlock`, `StatBlock`, `MapActionBlock`, `SourceBlock`, `FollowUpBlock` — data shapes unchanged. `TextBlock` (prose) unchanged.
- **Layout in the map-first UI**: the report lives in the existing left `ChatSidePanel` (408px desktop / bottom-sheet mobile). For wide content (side-by-side rows, large tables), keep the existing **full-screen `ArtifactModal`** as an "expand report" affordance — render the same `ReportRenderer` inside it at viewport width. (Optional but recommended; preserves the current expand UX.)
- **No `dangerouslySetInnerHTML`, no iframe.** Charts are React components; markdown stays sanitized. This is the multi-user safety boundary — keep it.

## 6. Store changes (`src/stores/websocketStore.ts`, `insightStore.ts`)

- `appendStructuredBlocks` (`websocketStore.ts:193-259`): accept nested `section`/`row` blocks (store the tree; do not flatten). `isInsightBlockType` gains the three new types.
- Streaming delta application (`applyStreamPayload`, `websocketStore.ts:305-405`): generalize "find text block by id and append markdown" to "find prose **or callout** block by id **anywhere in the tree** and append markdown; flip `streaming` off on `isComplete`." Add a tree-walking `getBlockById`/`updateBlockInTree`.
- Summary: the chat-bubble summary streams under its own `messageId` (separate from report block ids) — keep the existing chat-bubble streaming path for that id.
- `appendBlock` map-action side effect (`insightStore.ts:21-23`): still execute `mapActionActions.execute` when a `map-action` block arrives (now possibly nested inside a section — execute on emit regardless of nesting).
- **Retire the legacy duplication paths.** `appendArtifactBlocksIfMissing` / `appendChartBlockIfMissing` set `isArtifact:true` and double-render content already arriving as structured blocks — they are the source of the duplicate "Analysis" card. Remove (or gate) them so the composed report renders once.

## 7. Streaming UX (the Claude-like feel)

1. `block.emitted` arrives → the **full layout + all charts/tables/stats render instantly** with real data; prose/callout boxes show a subtle "writing…" state (`streaming:true`).
2. `block.stream.delta` streams fill each prose/callout box in document order.
3. The chat bubble streams the short `summary` in parallel/just before.
4. `response.completed` finalizes (`streaming:false`), follow-ups/quick-actions render.

## 8. Files touched (frontend)

- `src/types/insight.ts` — new block types + data shapes; replace `ChartBlockData`.
- `src/types/chat.ts` — (no shape change required; `ResponseBlockPayload.data` is `unknown`).
- `src/utils/websocket.ts` — `toWireType`/`FRONTEND_BLOCK_TYPES` + recursive `normalizeResponseBlocks` for containers.
- `src/stores/websocketStore.ts` — nested-tree append + tree-aware delta application; retire legacy artifact/chart duplication paths.
- `src/stores/insightStore.ts` — tree-aware update helpers; map-action on nested emit.
- `src/components/blocks/ChartBlock.tsx` — **rewrite** to Recharts (data-driven).
- `src/components/blocks/CalloutBlock.tsx`, `SectionBlock.tsx`, `RowBlock.tsx` — **new**.
- `src/components/insight/InsightPanel.tsx` (or new `ReportRenderer.tsx`) — document/tree rendering.
- `src/components/blocks/ArtifactModal.tsx` — render `ReportRenderer` for full-screen expand (optional).
- `package.json` — `recharts` already installed (^3.7.0); remove now-unused `marked` (confirmed dead) if convenient.

## 9. Acceptance criteria

- A turn renders as a **single sectioned document**: headings, prose, inline interactive charts, tables, stat rows, callouts — no orphaned cards.
- Charts are interactive (hover tooltip, legend toggle) and themed; **no `<img>` charts** remain.
- Side-by-side layout works (a `row` with two charts / a row of stat cards).
- Prose/callout text **streams in** after the structure appears; the chat bubble shows the short summary.
- All chart/table/stat numbers come from `block.emitted` `data` (backend-resolved); the frontend never synthesizes values.
- No `dangerouslySetInnerHTML`/iframe introduced; markdown stays sanitized.
- `pnpm build` + existing vitest (`pnpm test`) green; map-action wiring (flyTo/highlight/filter/toggleLayer) still works, including when nested in a section.

## 10. Non-goals

- No raw-HTML/React/iframe artifact rendering.
- No client-side data fetching or computation — the frontend only renders backend-resolved data.
- No backward compatibility with the old `imageUrl` chart path (backend + frontend deploy in lockstep).
