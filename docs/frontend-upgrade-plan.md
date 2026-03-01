# Frontend Upgrade Plan — Backend Phases 3–6

**Date**: 2026-02-26
**Scope**: Align frontend with agentic pipeline, agent status stages, and new city support
**Reference**: `Frontend Migration Guide — Backend Phases 3-6`

---

## Current State Assessment

### Already Done

- All 4 agent `StatusStage` values exist in `src/types/chat.ts` (`agent_thinking`, `agent_tool_call`, `agent_tool_result`, `agent_synthesizing`)
- All 4 cities (Philadelphia, Chicago, NYC, Cincinnati) are defined in `src/config/cities.ts`
- `StatusIndicator` already maps agent stages to the "Planning" and "Querying" UI phases
- WebSocket message parsing handles `status` type payloads

### Gaps to Fix

1. `needs_clarification` stage is missing from `StatusStage` type
2. `PhaseInfo` interface is untyped (uses index signature instead of explicit agent fields)
3. `StatusIndicator` only uses `phaseInfo.totalQueries` — agent-specific fields (`step`, `maxSteps`, `tool`, `rowCount`, `preview`) are ignored
4. No dedicated Agent Step Tracker component exists
5. Community resources disclaimer is missing for non-Philadelphia queries
6. No null-guards on `phaseInfo` destructuring for the new agent payload shape

---

## Implementation Steps

### Step 1 — Expand `StatusStage` type and `PhaseInfo` interface

**File**: `src/types/chat.ts`

#### 1a. Add `needs_clarification` to `StatusStage`

The backend emits `needs_clarification` when a query is too vague. The frontend must handle it without crashing.

```diff
 export type StatusStage =
+  // Phase 0: Clarification
+  | "needs_clarification"
   // Agent runtime lifecycle
   | "request_accepted"
   ...
```

Also add a user-facing text entry for it in `StatusIndicator.tsx`:

```
needs_clarification: "Needs more detail"
```

And map it to the "Planning" phase bucket in `PHASES`.

#### 1b. Replace the `PhaseInfo` index signature with explicit typed union

Current:

```typescript
export interface PhaseInfo {
  phase: string;
  description?: string;
  totalQueries?: number;
  [key: string]: unknown;  // too loose
}
```

Replace with a discriminated union that matches both the fixed pipeline and the agent pipeline exactly:

```typescript
export type PhaseInfo =
  | {
      phase: "understanding" | "planning" | "searching" | "analyzing" | "streaming" | "visualization";
      description?: string;
      queryType?: "single" | "multi";
      totalQueries?: number;
      rowCount?: number;
      chartType?: string;
    }
  | {
      phase: "agent";
      step: number;
      maxSteps: number;
      stage: "agent_thinking" | "agent_tool_call" | "agent_tool_result" | "agent_synthesizing";
      tool?: string;
# Frontend Integration Guide — Mode Toggle, Artifacts & Scratchpad-Backed Tools

Covers the backend response pipeline: mode toggle, artifact system, chart SDK, strict chart heuristic, prompt redesign, and scratchpad-backed tool returns.

**Backend branch**: `seanchang/upgrade-robustness`
**Last updated**: 2026-02-27

---

## Table of Contents

1. [What Changed (TL;DR)](#1-what-changed-tldr)
2. [Incoming Message Format](#2-incoming-message-format)
3. [Response Payload — Artifacts](#3-response-payload--artifacts)
4. [Backward Compatibility](#4-backward-compatibility)
5. [Mode Toggle — Auto vs Research](#5-mode-toggle--auto-vs-research)
6. [Status Stages Reference](#6-status-stages-reference)
7. [Complete Message Flow](#7-complete-message-flow)
8. [Rendering Artifacts](#8-rendering-artifacts)
9. [TypeScript Types](#9-typescript-types)
10. [Migration Checklist](#10-migration-checklist)
11. [Feature Flags](#11-feature-flags)
12. [Agent Tools Reference](#12-agent-tools-reference)
13. [Scratchpad & Dataset IDs](#13-scratchpad--dataset-ids)

---

## 1. What Changed (TL;DR)

| Change | Breaking? | Frontend action |
|--------|-----------|-----------------|
| New optional `mode` field in requests | No | Send `"mode": "research"` to enable deep analysis |
| New `artifacts` array in responses | No | Render multiple charts/markdown blocks |
| `chart` field still populated | No | Existing chart rendering still works |
| 4 agent status stages | No | Map to existing stages or build step tracker |
| Stricter auto-mode chart heuristic | No | Fewer charts in auto mode (intentional) |
| Simplified LLM responses | No | Cleaner text, fewer junk IDs in output |
| Tools return `dataset_id` summaries | No | `phaseInfo.preview` now shows `{dataset_id, row_count}` instead of raw rows |
| `query_incidents` params simplified | No | Removed unused `city`/`fatal_only`/`limit` — only `start_date`/`end_date` remain |
| `aggregate_data` accepts `dataset_id` | No | Agent chains tools via `dataset_id` references |

**Zero breaking changes.** All additions are optional fields. Old clients work without modification.

---

## 2. Incoming Message Format

### Before

```json
{
  "content": "How many shootings in Philadelphia 2024?",
  "isUser": true,
  "type": "chat",
  "updateMap": false,
  "requiresPreviousContext": false
}
```

### After

```json
{
  "content": "How many shootings in Philadelphia 2024?",
  "isUser": true,
  "type": "chat",
  "updateMap": false,
  "requiresPreviousContext": false,
  "mode": "auto"
}
```

The `mode` field is **optional**. If omitted, defaults to `"auto"`.

### Mode values

| Mode | Behavior |
|------|----------|
| `"auto"` | Default. Heuristic routing: simple queries use template SQL, complex queries use agent loop (max 8 steps). Auto-mode uses a **strict** chart heuristic (fewer, higher-quality charts). |
| `"research"` | Always uses agent loop with extended depth (max 12 steps). Agent can call `generate_chart` multiple times for multi-chart responses. Skips auto chart heuristic entirely. |

### Mode is sticky per session

Once a mode is sent, it persists for subsequent messages on the same WebSocket connection. Send a new mode value to change it mid-session.

```
Message 1: { "content": "...", "mode": "research" }  → research mode
Message 2: { "content": "..." }                       → still research mode
Message 3: { "content": "...", "mode": "auto" }       → back to auto mode
```

---

## 3. Response Payload — Artifacts

### Before

```json
{
  "type": "response",
  "payload": {
    "task": "chat",
    "message": null,
    "chart": "iVBORw0KGgo...",
    "quickActions": [...],
    "messageId": "msg-abc",
    "sessionId": "sess-123"
  }
}
```

### After

```json
{
  "type": "response",
  "payload": {
    "task": "chat",
    "message": null,
    "chart": "iVBORw0KGgo...",
    "artifacts": [
      {
        "id": "auto_chart_a1b2c3d4",
        "type": "chart",
        "title": "Monthly Trend",
        "content": "iVBORw0KGgo...",
        "metadata": {
          "chart_type": "time_series",
          "source": "auto_heuristic"
        }
      }
    ],
    "quickActions": [...],
    "messageId": "msg-abc",
    "sessionId": "sess-123"
  }
}
```

### Artifact shape

```typescript
interface Artifact {
  id: string;                    // Unique ID (e.g., "chart_a1b2c3d4", "auto_chart_e5f6")
  type: "chart" | "markdown";   // Artifact type
  title: string;                 // Human-readable title for display
  content: string;               // Base64 PNG (for chart) or markdown string (for markdown)
  metadata?: {                   // Optional context
    chart_type?: string;         // "time_series" | "bar" | "pie" | "multi_line_time_series"
    source?: string;             // "auto_heuristic" | "generate_chart" (agent tool)
    x_field?: string;
    y_field?: string;
    [key: string]: any;
  };
}
```

### When do artifacts appear?

| Mode | Source | Artifacts? | `chart` field? |
|------|--------|-----------|----------------|
| Auto | Strict heuristic generated a chart | 1 chart artifact | Yes (same base64) |
| Auto | No chart generated | Empty/absent | `null` |
| Research | Agent called `generate_chart` once | 1 chart artifact | Yes (first chart) |
| Research | Agent called `generate_chart` 3x | 3 chart artifacts | Yes (first chart only) |
| Research | Agent produced no charts | Empty/absent | `null` |

### Multiple artifacts in research mode

Research mode can produce multiple artifacts — this is the key UX improvement:

```json
{
  "artifacts": [
    {
      "id": "chart_a1b2c3d4",
      "type": "chart",
      "title": "Fatal Shootings Over Time",
      "content": "iVBORw0KGgo...",
      "metadata": { "chart_type": "time_series" }
    },
    {
      "id": "chart_e5f6g7h8",
      "type": "chart",
      "title": "Incidents by City",
      "content": "iVBORw0KGgo...",
      "metadata": { "chart_type": "bar" }
    },
    {
      "id": "chart_i9j0k1l2",
      "type": "chart",
      "title": "Race Distribution",
      "content": "iVBORw0KGgo...",
      "metadata": { "chart_type": "pie" }
    }
  ]
}
```

---

## 4. Backward Compatibility

### `chart` field is auto-populated

If the backend produces artifacts but the frontend only reads `payload.chart`, it still works:

```
Backend logic:
  1. If chart param is None AND artifacts has a chart → chart = first chart artifact's content
  2. If chart param is set → use it directly
  3. If no charts at all → chart = null (omitted from JSON)
```

### `null` fields are omitted

`model_dump(exclude_none=True)` means absent fields don't appear in JSON at all:

```json
// No chart, no artifacts → clean JSON
{
  "type": "response",
  "payload": {
    "task": "chat",
    "quickActions": [...],
    "messageId": "msg-abc",
    "sessionId": "sess-123"
  }
}
```

### Unknown fields are safe to ignore

JSON parsers naturally ignore unknown keys. A frontend that doesn't know about `artifacts` will just skip it.

---

## 5. Mode Toggle — Auto vs Research

### UI recommendation: Toggle or dropdown

```
┌─────────────────────────────────────────────────────────┐
│  Ask about gun violence data...                         │
│                                                         │
│  ┌──────────┐ ┌────────────┐                     [Send] │
│  │ ● Auto   │ │ ○ Research │                            │
│  └──────────┘ └────────────┘                            │
└─────────────────────────────────────────────────────────┘
```

Or as a subtle toggle:

```
┌──────────────────────────────────────────────────────────────┐
│  Ask about gun violence data...                    [⚡Auto ▾] │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                                              ┌─────────────┐
                                              │ ⚡ Auto      │
                                              │ 🔬 Research  │
                                              └─────────────┘
```

### Behavioral differences users should understand

| | Auto | Research |
|---|------|----------|
| **Speed** | Fast (1-10s) | Slower (5-20s) |
| **Depth** | 1 query or agent (8 steps max) | Agent loop (12 steps max) |
| **Charts** | 0-1 (strict heuristic) | 0-N (agent decides) |
| **Best for** | Quick lookups, simple counts | Multi-angle analysis, comparisons |
| **Response** | Concise | Structured (Summary, Analysis, Methodology) |

### When to recommend research mode

Suggest research mode for queries like:

- "Compare fatal vs non-fatal trends across all cities"
- "What are the demographic patterns in high-incident areas?"
- "Analyze the relationship between poverty and gun violence"

---

## 6. Status Stages Reference

### All stages (complete list)

```typescript
type StatusStage =
  // Clarification
  | "needs_clarification"
  // Planning
  | "classifying_query"
  | "planning_queries"
  // SQL
  | "generating_sql"
  | "validating_sql"
  | "executing_query"
  | "retrying_query"
  | "searching_alternatives"
  // Processing
  | "processing_results"
  | "interpreting_data"
  | "synthesizing"
  // Agent loop
  | "agent_thinking"
  | "agent_tool_call"
  | "agent_tool_result"
  | "agent_synthesizing"
  // Response
  | "generating_response"
  | "streaming_response"
  // Visualization
  | "generating_chart"
  | "generating_map"
  // Done
  | "complete";
```

### Mapping agent stages to existing UI (minimal migration)

If you don't want to build a new agent UI yet:

```typescript
function normalizeStage(stage: string): string {
  const agentMapping: Record<string, string> = {
    agent_thinking: "planning_queries",
    agent_tool_call: "executing_query",
    agent_tool_result: "processing_results",
    agent_synthesizing: "generating_response",
  };
  return agentMapping[stage] ?? stage;
}
```

### Agent phaseInfo shape

When `phaseInfo.phase === "agent"`:

```typescript
interface AgentPhaseInfo {
  phase: "agent";
  step: number;           // Current step (1-indexed)
  maxSteps: number;       // 8 (auto) or 12 (research)
  stage?: string;         // Redundant stage name
  tool?: string;          // Tool name (agent_tool_call, agent_tool_result only)
  args?: object;          // Tool arguments (agent_tool_call only)
  rowCount?: number;      // Results count (agent_tool_result only) — null for dict-returning tools
  preview?: string;       // Truncated result (agent_tool_result only)
}
```

> **Note on `rowCount`:** Most data tools now return `dict` (with `dataset_id`, `row_count`, etc.)
> instead of `list[dict]`. The agent loop sets `rowCount = len(result)` only when the result is a
> list, so for scratchpad-backed tools this will be `null`. Use `preview` (which shows the first
> 200 chars of the JSON return) to extract the `row_count` field if needed, or treat `null` as
> "results available" and rely on the tool status description instead.

### Progress calculation

Agent status `progress` is calculated as `15 + (step / maxSteps) * 50`, giving a 15-65% range during the agent loop. Streaming and charts fill 65-100%.

---

## 7. Complete Message Flow

### Auto mode — simple query

```
→ { content: "How many shootings in philly 2024?", type: "chat" }

← status: classifying_query (5%)
← status: planning_queries (10%)
← status: generating_sql (15%)
← status: executing_query (25%)
← status: processing_results (45%)
← status: generating_response (55%)
← status: streaming_response (65%)
← stream: { chunk: "Based on...", isComplete: false }
← stream: { chunk: " the data...", isComplete: false }
← stream: { chunk: "", isComplete: true }
← response: { task: "chat", quickActions: [...], messageId: "..." }
← status: complete (100%)
```

### Auto mode — complex query (agent loop)

```
→ { content: "Compare trends across all cities 2020-2024", type: "chat" }

← status: classifying_query (5%)
← status: planning_queries (10%)
← status: generating_sql (15%)
← status: agent_thinking (15%)
← status: agent_tool_call (20%)       tool: "plan_and_execute"
← status: agent_tool_result (25%)     preview: {"success":true,"datasets":[{"dataset_id":"plan_and_execute_a1b2..."}]}
← status: agent_thinking (30%)
← status: agent_tool_call (35%)       tool: "generate_chart", args: {dataset_id: "plan_and_execute_a1b2..."}
← status: agent_tool_result (40%)     preview: {"chart_generated":true,"artifact_id":"chart_c3d4..."}
← status: streaming_response (65%)
← stream: chunks...
← response: { chart: "b64...", artifacts: [{...}], quickActions: [...] }
← status: complete (100%)
```

Tools now return lightweight summaries with `dataset_id` references instead of raw data rows.
The agent chains tools by passing `dataset_id` from one tool to the next (e.g., `plan_and_execute` → `generate_chart`).

### Research mode — multi-chart analysis

```
→ { content: "Analyze fatal shooting patterns in Chicago", type: "chat", mode: "research" }

← status: classifying_query (5%)
← status: planning_queries (10%)
← status: generating_sql (15%)
← status: agent_thinking (15%)
← status: agent_tool_call (17%)       tool: "plan_and_execute"
← status: agent_tool_result (19%)     preview: {"success":true,"datasets":[...]}
← status: agent_tool_call (21%)       tool: "generate_chart"    ← chart from dataset_id
← status: agent_tool_result (23%)     preview: {"chart_generated":true,...}
← status: agent_tool_call (25%)       tool: "execute_sql"       ← targeted follow-up
← status: agent_tool_result (27%)     preview: {"dataset_id":"execute_sql_e5f6...","row_count":12,...}
← status: agent_tool_call (29%)       tool: "generate_chart"    ← second chart
← status: agent_tool_result (31%)     preview: {"chart_generated":true,...}
← status: agent_thinking (55%)
← status: streaming_response (65%)
← stream: chunks...
← response: {
     chart: "b64_first_chart...",        ← backward compat (first chart)
     artifacts: [
       { id: "chart_1", type: "chart", title: "Fatal Trends", ... },
       { id: "chart_2", type: "chart", title: "By Census Tract", ... }
     ],
     quickActions: [...]
   }
← status: complete (100%)
```

---

## 8. Rendering Artifacts

### Strategy: progressive enhancement

```typescript
function renderResponse(payload: ResponsePayload) {
  // 1. Always render streamed text (already handled by stream chunks)

  // 2. Render artifacts if present (new path)
  if (payload.artifacts?.length) {
    return payload.artifacts.map(renderArtifact);
  }

  // 3. Fallback: render legacy chart field (backward compat)
  if (payload.chart) {
    return renderLegacyChart(payload.chart);
  }
}
```

### Rendering chart artifacts

```tsx
function ChartArtifact({ artifact }: { artifact: Artifact }) {
  return (
    <figure className="artifact artifact--chart">
      <img
        src={`data:image/png;base64,${artifact.content}`}
        alt={artifact.title}
        className="artifact__image"
      />
      <figcaption className="artifact__title">{artifact.title}</figcaption>
    </figure>
  );
}
```

### Rendering markdown artifacts

```tsx
import ReactMarkdown from "react-markdown";

function MarkdownArtifact({ artifact }: { artifact: Artifact }) {
  return (
    <div className="artifact artifact--markdown">
      <h4 className="artifact__title">{artifact.title}</h4>
      <ReactMarkdown>{artifact.content}</ReactMarkdown>
    </div>
  );
}
```

### Rendering multiple artifacts

```tsx
function ArtifactList({ artifacts }: { artifacts: Artifact[] }) {
  if (!artifacts?.length) return null;

  return (
    <div className="artifacts">
      {artifacts.map((art) => (
        <div key={art.id} className="artifacts__item">
          {art.type === "chart" ? (
            <ChartArtifact artifact={art} />
          ) : (
            <MarkdownArtifact artifact={art} />
          )}
        </div>
      ))}
    </div>
  );
}
```

### Layout suggestions

**Single chart (auto mode):** Same as current — display below the text response.

**Multiple charts (research mode):**

```
┌─────────────────────────────────────────────────┐
│  [AI Response Text - streamed]                  │
│                                                 │
│  Based on the analysis of Chicago fatal...      │
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │  Fatal Trends    │  │  By Census Tract │     │
│  │  [time series]   │  │  [bar chart]     │     │
│  └─────────────────┘  └─────────────────┘      │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Follow 1 │ │ Follow 2 │ │ Follow 3 │        │
│  └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────┘
```

For 3+ charts, consider a scrollable gallery or tabs.

---

## 9. TypeScript Types

Complete type definitions for the frontend:

```typescript
// --- Incoming (Frontend → Backend) ---

interface ChatMessage {
  content: string;
  isUser: boolean;
  type: "chat" | "filter_update" | "census_update";
  updateMap?: boolean;
  requiresPreviousContext?: boolean;
  mode?: "auto" | "research";  // NEW
}

// --- Outgoing (Backend → Frontend) ---

interface WSMessage {
  type: "status" | "response" | "stream" | "error";
  payload: StatusPayload | ResponsePayload | StreamPayload | ErrorPayload;
  metadata: {
    timestamp: number;
    sessionId: string;
  };
}

// --- Artifact types (NEW) ---

type ArtifactType = "chart" | "markdown";

interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

// --- Response (updated) ---

interface ResponsePayload {
  task: "chat" | "filter_update" | "census_update";
  message?: {
    id: string;
    type: string;
    content: string;
    timestamp: string;
    task: string;
  };
  data?: any;                    // GeoJSON or other data
  chart?: string;                // Base64 PNG (backward compat)
  artifacts?: Artifact[];        // NEW: structured artifacts
  sessionId?: string;
  quickActions?: QuickAction[];
  messageId?: string;
}

interface QuickAction {
  label: string;
  query: string;
  icon?: string;
}

// --- Status ---

interface StatusPayload {
  stage: string;
  message: string;
  progress?: number;
  attempt?: number;
  maxAttempts?: number;
  subStep?: string;
  totalSubSteps?: number;
  currentSubStep?: number;
  estimatedTimeMs?: number;
  phaseInfo?: {
    phase: string;
    // Agent-specific fields
    step?: number;
    maxSteps?: number;
    stage?: string;
    tool?: string;
    args?: Record<string, any>;
    rowCount?: number;
    preview?: string;
    // Pipeline-specific fields
    queryType?: string;
    description?: string;
    chartType?: string;
  };
}

// --- Stream ---

interface StreamPayload {
  task: "chat" | "filter_update" | "census_update";
  chunk: string;
  messageId: string;
  isComplete: boolean;
  sessionId?: string;
}

// --- Error ---

interface ErrorPayload {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, any>;
}
```

---

## 10. Migration Checklist

### Phase A: Zero-effort (backward compat works)

- [x] Existing `chart` field still works
- [x] Missing `mode` field defaults to `"auto"`
- [x] Unknown status stages fall through to default handler
- [x] Unknown JSON fields are ignored

### Phase B: Minimal integration

- [ ] Add `"mode"` field to outgoing messages (wire up a toggle)
- [ ] Add default case to status stage handler (if using exhaustive switch)
- [ ] Map agent stages to existing stages with `normalizeStage()`

### Phase C: Full integration

- [ ] Build mode toggle UI (auto/research selector)
- [ ] Render `artifacts` array (multiple charts, markdown blocks)
- [ ] Build agent step tracker showing tool calls in real time
- [ ] Use `phaseInfo.step` / `phaseInfo.maxSteps` for agent progress bar
- [ ] Show `phaseInfo.tool` descriptions during agent execution
- [ ] Handle research-mode multi-chart layout (grid/gallery/tabs)
- [ ] Handle `rowCount: null` in step tracker (tools now return dicts, not lists)
- [ ] Parse `row_count` from `preview` JSON for display (see Section 13)

### Phase D: Polish

- [ ] Show chart titles from `artifact.title`
- [ ] Add chart type indicator using `artifact.metadata.chart_type`
- [ ] Animate transitions between agent steps
- [ ] Show "Research mode" badge on responses from research mode
- [ ] Persist mode preference in localStorage
- [ ] Format tool result previews using `formatToolPreview()` helper (see Section 13)

---

## 11. Feature Flags

### Backend flags

```python
# app/core/config.py
ENABLE_AGENT_LOOP: bool = True    # False → legacy multi-query, no agent_* stages
DEFAULT_CHAT_MODE: str = "auto"   # Default when frontend doesn't send mode
```

### Detecting pipeline type from frontend

```typescript
const isAgentPipeline = statusPayload.phaseInfo?.phase === "agent";
const isResearchMode = currentMode === "research";  // from your state
```

When `ENABLE_AGENT_LOOP=False`, the backend never emits `agent_*` stages.

---

## 12. Agent Tools Reference

Tools the agent may call (visible in `phaseInfo.tool`):

| Tool | Status Description | What It Does | Returns |
|------|--------------------|-------------|---------|
| `plan_and_execute` | Planning and executing parallel queries | Plans 2-5 SQL queries, runs them in parallel, builds evidence | `{success, datasets: [{dataset_id, ...}], evidence}` |
| `execute_sql` | Running database query | Run validated SELECT query | `{dataset_id, row_count, columns, preview}` |
| `query_incidents` | Fetching yearly incident counts | Get fatal/non-fatal counts per year | `{dataset_id, row_count, columns, preview}` |
| `query_incidents_geojson` | Fetching map data | Get GeoJSON for map (stored in scratchpad) | `{dataset_id, feature_count, date_range, cities}` |
| `get_community_resources` | Looking up community resources | Find food/shelter/mental health services | `{dataset_id, row_count, columns, preview}` |
| `aggregate_data` | Computing aggregates | Compute stats from data rows or `dataset_id` | `{total_rows, numeric_stats, ...}` |
| `generate_chart` | Generating visualization | Create chart artifact from data or `dataset_id` | `{chart_generated, artifact_id, title}` |
| `generate_markdown` | Creating analysis section | Create structured markdown artifact | `{artifact_created, artifact_id, title}` |
| `predict_fatality` | Running fatality prediction model | Logistic regression P(fatal) | `{probability, odds_ratios, ...}` |
| `detect_anomalous_tracts` | Detecting anomalous areas | Z-score anomaly detection | `{watchlist: [...], ...}` |
| `segment_tracts` | Segmenting census tracts | K-means tract clustering | `{clusters: [...], ...}` |
| `lookup_faq` | Checking FAQ cache | Match pre-computed answers | `{matched, answer, ...}` or `null` |

### Tool parameter changes (latest)

| Tool | Removed params | Added params | Notes |
|------|----------------|-------------|-------|
| `query_incidents` | `city`, `fatal_only`, `census_tract_id`, `limit` | — | Only `start_date`/`end_date` remain (both optional). Removed params were never used by the underlying repo. |
| `execute_sql` | — | — | Return type changed: `list[dict]` → `dict` with `dataset_id` |
| `get_community_resources` | — | — | Return type changed: `list[dict]` → `dict` with `dataset_id` |
| `aggregate_data` | — | `dataset_id: Optional[str]` | Can now reference scratchpad data instead of passing `data` directly. `data` is now optional. |
| `query_incidents_geojson` | — | — | Now returns metadata only; full GeoJSON stored in scratchpad |

---

## 13. Scratchpad & Dataset IDs

### Why this matters for the frontend

Data tools no longer return raw rows to the LLM. Instead they store data in a per-request **scratchpad** and return a lightweight summary with a `dataset_id`. The agent chains tools by passing `dataset_id` references (e.g., `execute_sql` → `generate_chart`).

This is an **internal optimization** — the frontend doesn't interact with the scratchpad directly. But it changes what you see in agent status events:

### Before (raw rows in tool results)

```
← agent_tool_result  tool: "execute_sql"  rowCount: 240
    preview: "[{\"year\":2020,\"fatal\":85,\"nonFatal\":320},{\"year\":2021,...}]"
```

### After (dataset_id summary in tool results)

```
← agent_tool_result  tool: "execute_sql"  rowCount: null
    preview: "{\"dataset_id\":\"execute_sql_a1b2c3d4\",\"row_count\":240,\"columns\":[\"year\",\"fatal\",\"nonFatal\"],\"preview\":[...]}"
```

### What changed

| Aspect | Before | After |
|--------|--------|-------|
| `phaseInfo.rowCount` | Populated (was `len(result)` for list returns) | `null` for most data tools (result is now a dict) |
| `phaseInfo.preview` | Raw JSON rows (first 200 chars) | Summary JSON: `{dataset_id, row_count, columns, preview}` |
| Token usage | Raw rows sent to LLM context | Only 3-row preview sent; full data in scratchpad |
| Tool chaining | Agent re-queried or passed full data | Agent passes `dataset_id` between tools |

### Frontend implications

1. **If you display `rowCount` in the step tracker:** Fall back to parsing `row_count` from the preview string, or show a generic "Results ready" message when `rowCount` is null.

2. **If you display `preview` text:** The preview is now a JSON summary object, not raw data. Consider formatting it:

```typescript
function formatToolPreview(event: ToolResultEvent): string {
  if (event.rowCount != null) {
    return `Got ${event.rowCount} results`;
  }

  // Parse the summary dict from preview
  try {
    const summary = JSON.parse(event.preview);
    if (summary.row_count != null) {
      return `Got ${summary.row_count} results (${summary.columns?.join(", ")})`;
    }
    if (summary.feature_count != null) {
      return `Got ${summary.feature_count} map features`;
    }
    if (summary.chart_generated) {
      return `Chart created: ${summary.title}`;
    }
    if (summary.artifact_created) {
      return `Section created: ${summary.title}`;
    }
  } catch {}

  return "Got results";
}
```

1. **If you don't parse tool results at all:** No changes needed. The status description strings (`"Running database query..."`, `"Fetching yearly incident counts..."`) are unchanged and work as before.

### Dataset ID lifecycle

```
Request starts
  → Scratchpad created (empty)
  → Agent calls plan_and_execute
    → Stores query results → dataset_id: "plan_and_execute_a1b2"
  → Agent calls generate_chart(dataset_id: "plan_and_execute_a1b2")
    → Reads data from scratchpad → generates chart → stores artifact
  → Agent calls execute_sql (follow-up)
    → Stores results → dataset_id: "execute_sql_c3d4"
  → Agent calls aggregate_data(dataset_id: "execute_sql_c3d4")
    → Reads data from scratchpad → returns aggregates
  → Agent synthesizes final answer
  → Artifacts collected from scratchpad → sent in response payload
Request ends
  → Scratchpad cleared (memory freed)
```

Dataset IDs are ephemeral — they only exist for the duration of a single request. They are not returned to the frontend and cannot be referenced across requests.
