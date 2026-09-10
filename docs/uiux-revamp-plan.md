# OKN UI/UX Revamp Plan

**Owner:** Lead Designer-Engineer · **Status:** Ready for engineering · **Branch target:** `main`
**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · HeroUI · Mapbox GL JS 3.19 · Nanostores (persisted) · WebSocket streaming · Recharts · Turf.js
**Scope:** Replace the top-left floating chat card with a docked, map-first layout, and replace all-at-once blocking data loading with progressive per-layer hydration.

---

## 1. Executive Summary

The current app puts an opaque chat card glued to the **top-left corner** over a full-bleed map, and it blocks first paint behind a **full-screen blur** until the incident + census datasets finish downloading. Both read as "an app bolted onto a map" rather than a map-first civic tool. The five highest-leverage changes:

1. **Dock the conversation on the right, as a real layout sibling — not a `position:fixed` overlay.** Convert `ChatMapApp.tsx`'s overlay tree into a CSS grid where the map is `1fr` (min ~640px) and the panel is its own column sized by the already-built-but-dead `sidebarWidthStore` (380–720, default 460). The map flexes narrower but is **never occluded**, and — because the panel is a sibling column, not an overlay — the map cell never sits under it. This single change resolves the "unintuitive, hard to look at" complaint. *(Winner: Right-Docked Insight Panel.)*

2. **Add a bottom-center "Ask" omnibox as the default, map-first query entry.** The winning layout's one real gap is that quick lookups in the collapsed state require summoning a whole reading column. We graft the runners-up's omnibox: a slim, always-available composer at bottom-center (Google "Ask Maps" / Perplexity two-role pattern). Submitting expands the right dock (desktop) or the bottom sheet (mobile). Low footprint, high discoverability, native-to-map — with an explicit **bottom-edge budget** (§4.6) so it does not re-create the crowding we rejected in the runner-up.

3. **Kill the full-map blur; ship progressive per-layer hydration.** Flip `isLoaded=true` the instant the basemap fires `load` with empty sources, then hydrate each layer independently (`Promise.allSettled`) with quiet per-layer affordances. The map is interactive in **<1s** instead of waiting on the combined incident + census fetch. A new non-persisted `mapLayerStore` is the coordination glue.

4. **Split the incident source (base vs. query), arbitrate their visibility, and drive LOD-by-zoom on an UN-clustered base.** A static `shooting-base` source plus a small dynamic `shooting-query` source means chat results re-tile only a few hundred features, not the entire corpus — eliminating the real jank behind "Updating map…". **Because today a query *replaces* the corpus, the split must hide the base while a query is active** (§4.5, §5.2) or every query would double-render the 3-year corpus underneath it. LOD is heatmap density at low/mid zoom and individual **obfuscated** points only at neighborhood zoom (≥14) — which already delivers the responsible-display default (no individual victim points at city zoom) **without** clustering the heatmap's source (clustering a GeoJSON source the heatmap reads renders distorted density — see §5.2).

5. **Hold the civic line everywhere.** Reuse the existing semantic token system (`bg-surface-1`, `border-line-1`, `text-ink-*`, accent rails, `.text-*` type scale) so AI output reads as native chrome. Make the panel a labelled landmark with keyboard-resizable handle, Esc-to-collapse, `aria-live` streaming, reduced-motion-default reveals; define explicit **error / empty-result / reconnect** states (§4.7); encode neighborhood fills as **per-capita rates** (not raw counts); obfuscate incident locations; and attach provenance (`SourceBlock`) to every statistic.

**Sequencing:** Item 3 (progressive loading) and the source split + visibility arbitration in item 4 are client-only and ship **first** in Phase 0 because they are the biggest *perceived* improvement at the least cost and have no dependency on the layout refactor. The dock + omnibox land in Phase 1. Phase-0 loading surfaces are explicitly placed to coexist with the *old* chrome (§6).

---

## 2. Problem Statement

### 2.1 The top-left floating chat card

Per the codebase audit (`layout` area, `high` severity findings):

- **`src/components/chat/ChatSidePanel.tsx` (lines 31–34)** renders the desktop chat as
  `fixed z-40 … left-4 top-4 w-[408px] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl border shadow-lg`, entering with an `x:-440` slide. This is **literally a floating card overlaying the map at the corner** — it does not reserve map width, it sits *on top of* the map, and (with `max-h-[calc(100dvh-2rem)]`) can extend nearly the full left edge, hiding the map's own controls and attribution behind it. This is the exact "unintuitive, hard to look at" surface the user reported.
- **`src/components/core/ChatMapApp.tsx`** renders the map as a full-bleed sibling and the chat as a *separate* `AnimatePresence`-wrapped fixed element (chat guarded by `!isEmbedMode` at lines 478/520). There is **no flex/grid split** — `chatMode` is read but only forwarded to `Map` to trigger `map.resize()`; it never drives a layout split. There is no container that can give the chat a real dock region.
- **The docking infra already exists but is dead.** `chatLayoutStore.ts` defines `sidebarWidthStore` (persisted, clamped `SIDEBAR_MIN_WIDTH=380`/`SIDEBAR_MAX_WIDTH=720`, default 460) and `setSidebarWidth` — confirmed referenced **only inside the store** (no component reads them). `ChatSidePanel` hardcodes `w-[408px]` (not even the 460 default). The `desktopChatModeStore` + `openFloating/openSidebar/toggleFloatingSidebar` actions and `floatingPosition/Dimensions/DockEdgeStore` atoms exist but **have no UI entry point** and are never written (`floatingDockEdgeStore` is read once by `OknChartsPanel.tsx` as a frozen `'right'`). So a complete resizable/dockable/floating contract is built and inert.
- **The Toolbar geometry is coupled to the card by a magic number.** `src/components/toolbar/Toolbar.tsx` sizes itself `md:w-[min(38rem,calc(100vw-29rem))]` — the `29rem` is a hand-tuned reservation to dodge the chat card's width. Layout geometry is governed by a guess, not by structure.
- **Accessibility gaps.** The fixed container is a bare `motion.div` with no `role`, no `aria-label`, no landmark, no focus trap, no Escape-to-dismiss, no focus restoration. The mobile sheet's drag handle is a non-interactive `<span>` (no keyboard collapse), and the 767px breakpoint is duplicated across `ChatMapApp` (`syncViewportMode`) and `ChatSidePanel` (local `matchMedia`) — two sources that can drift.

### 2.2 All-at-once blocking data loading

- **`src/hooks/useMapbox.tsx`** initializes the map, then `await`s `setupMapSources(map)`. The accurate mechanism (verified in `src/utils/map/mapbox.ts`): `setupMapSources` adds the empty sources, then runs **`Promise.all([fetchHeatmapGeoJSON(...), fetchGeoJSON(censusBlocks)])`**, then **sequentially `await`s** community resources and businesses — each already wrapped in `try/catch` with fallbacks, so those two **cannot reject** and already fail soft. All of this completes **before `isLoaded=true`**. So first paint is gated on the **combined** incident + census fetch (the `Promise.all`) plus two serial soft-failing fetches — not a 4-way joint `Promise.all`. The thesis still holds (first paint waits on the slowest combined fetch); the fix is to parallelize and decouple incident + census from first paint via `Promise.allSettled`.
- **`src/utils/map/mapbox.ts`** `fetchGeoJSON` plain-fetches whole files; `setupMapLayers` builds `shooting-heat` (heatmap) + `shooting-point` (circle, `minzoom:14`) from **one un-clustered** `shooting` source.
- **Chat results replace data wholesale.** `websocketStore.ts` sets `mapLoading=true`/`mapStatusMessage="Updating map…"` on the `generating_map` stage, then on the response replaces `geoJSONData` entirely; `useMapbox.updateShootingData(data)` calls `source.setData(data)` on the **single large `shooting` source**, forcing GL JS to re-tile the entire corpus **per query** — the actual cause of the "Updating map…" jank spike. Note the current behavior is a *replace*: the user sees only the query subset. Any source split must preserve that (§4.5, §5.2).
- **`src/components/charts/Map.tsx`** blurs the **entire map** (`filter blur-sm`) behind a full `MapLoader` overlay whenever `mapLoading` is true. For a public-health tool, a flashy whole-screen blur reads as fragile and heavy.
- **There is none of:** clustering/supercluster, viewport/bbox fetching, vector tiles, web-worker parsing, per-layer skeletons, or incremental reveal. Everything loads at once behind a blocking blur.

---

## 3. Research Insights (decision-relevant)

The full research brief spans six topics; the findings that actually shaped the design:

**Where the assistant lives in a map app:**
- **CARTO AI Agents** ([carto.com](https://carto.com/blog/how-organizations-are-using-ai-to-democratize-spatial-analysis/)) — the AI agent is a **docked side-panel toggled on** alongside the basemaps panel; the default view is an unobstructed map. *Docked-rail-with-toggle is the prevailing enterprise GIS pattern.*
- **Felt AI** ([felt.com/platform/felt-ai](https://felt.com/platform/felt-ai)) — AI is reached from the **toolbar**, not a permanently-glued card; output is rendered **into the legend / right-side panels** and "automatically matches Felt's design." *Theme AI output into existing chrome.*
- **Atlas.co "Navi"** ([atlas.co](https://atlas.co/blog/introducing-navi-ai-that-builds-maps-from-conversation/)) and **ArcGIS AI components** ([developers.arcgis.com](https://developers.arcgis.com/javascript/latest/references/ai-components/)) — the conversation's primary output is a **change to map state**, and outputs are **inspectable artifacts** (renderers, pop-ups), not open-ended prose. OKN already has `MapActionBlock`.
- **Google "Ask Maps" (Gemini)** ([blog.google](https://blog.google/products-and-platforms/products/maps/ask-maps-immersive-navigation/)) — entry point is a **lightweight query affordance**, not a persistent panel; answers appear as cards/pins on the map. *A minimal omnibox reads as native-to-map.*
- **UX Collective, "Where should AI sit in your UI?"** ([uxdesign.cc](https://uxdesign.cc/where-should-ai-sit-in-your-ui-1710a258390e)) — spatial placement defines the user's mental model and trust; for AI that analyzes, a **split process/result** layout is recommended (talk on one side, the work on the other). *Argues directly against OKN's corner card.*

**Command-bar / omnibox patterns:**
- **Perplexity** ([unusual.ai](https://www.unusual.ai/blog/perplexity-platform-guide-design-for-citation-forward-answers)) — one composer, **two roles**: centered hero in the empty state, pinned follow-up footer once answering; numbered, expandable source cards; restrained near-black aesthetic that "reads closer to Google Scholar than ChatGPT." *The trust aesthetic OKN's domain needs.*
- **Maggie Appleton, "Command-K Bars"** ([maggieappleton.com](https://maggieappleton.com/command-bar)) + **cmdk** ([github.com/pacocoursey/cmdk](https://github.com/pacocoursey/cmdk)) — ⌘K bars blend CLI speed with GUI discoverability; `cmdk` auto-manages `role=combobox/listbox/option` + `aria-activedescendant` but **deliberately does not trap focus** — wrap in Radix Dialog.
- **NN/g Bottom Sheets** ([nngroup.com](https://www.nngroup.com/articles/bottom-sheet/)) — ~75% of users are one-thumbed; the **bottom-center** is the comfortable thumb zone; partial-height sheets keep map context visible; sheets need drag-to-resize and a clear handle. *But the bottom edge is finite — co-resident bottom surfaces must be budgeted (§4.6).*

**Professional data-tool layout systems:**
- **VS Code** ([code.visualstudio.com/api/ux-guidelines/sidebars](https://code.visualstudio.com/api/ux-guidelines/sidebars)) and **Figma** ([help.figma.com](https://help.figma.com/hc/en-us/articles/360039831974)) — strict role split: **left = stable structure/navigation, right = context that changes with selection**; panels collapsible to maximize the canvas; layout persisted across sessions. **Notion Side Peek** ([notion.com](https://www.notion.com/help/navigate-with-the-sidebar)) and **Datadog explorers** ([datadoghq.com](https://www.datadoghq.com/blog/datadog-dashboards/)) — selection opens detail in a **right side-panel beside** the artifact, never navigating away.
- **Linear UI redesign** ([linear.app](https://linear.app/now/how-we-redesigned-the-linear-ui), [changelog](https://linear.app/changelog/2026-03-12-ui-refresh)) — a single "inverted-L" chrome, **dimmed** so the working content takes visual precedence; reduce icon usage, scale icons down, remove colored backgrounds. *Recede-the-chrome; reserve saturated color for data.*
- **react-resizable-panels** ([github.com/bvaughn/react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)) — `PanelGroup`/`Panel`/`PanelResizeHandle` with keyboard resize + ARIA; **known gap (#234): persist a separate collapsed boolean** rather than inferring collapse from near-min width.

**Civic / public-health domain (non-negotiable):**
- **Everytown Local Dashboards Toolkit** ([everytownresearch.org](https://everytownresearch.org/report/local-gun-violence-dashboards-toolkit/)) — **address obfuscation is mandatory** (snap to block centroid); lead with **plain-language summary sentences** (Philadelphia model); two-tier audience (community member first, advanced data second).
- **UChicago Crime Lab "Safety Gap"** ([crimelab.uchicago.edu](https://crimelab.uchicago.edu/projects/violence-reduction-dashboard/)) and **The Trace** ([datahub.thetrace.org](https://datahub.thetrace.org/)) — frame as **disparity/inequity**, not "dangerous neighborhoods"; resist "if it bleeds it leads"; give every neighborhood **equal visual dignity**; pair downloads with methodology.
- **Choropleth-bias research** ([Springer](https://link.springer.com/article/10.1007/s10612-023-09720-w)) — map **rates per capita**, never raw counts; dot clouds reproduce **territorial stigma**.
- **Gun Violence Archive methodology** ([gunviolencearchive.org](https://www.gunviolencearchive.org/methodology)) — source-link every incident; normalize uncertainty (numbers may change); **deliberately no victim demographics**.

**Progressive loading & perceived performance:**
- **Mapbox large-GeoJSON guide** ([docs.mapbox.com](https://docs.mapbox.com/help/troubleshooting/working-with-large-geojson-data/)) — `cluster:true` for *point* rendering; cap `maxzoom~12`; `buffer:0`; 6-decimal coords + pruned properties cut a sample **19.3 MB → 3.3 MB**; two-source split (large static + small dynamic). **Supercluster** ([blog.mapbox.com](https://blog.mapbox.com/clustering-millions-of-points-on-a-map-with-supercluster-272046ec5c97)) is built into GL JS — but clustering exposes only cluster + leftover-unclustered features, so it is incompatible with a **heatmap** layer on the same source (see §5.2).
- **NN/g Skeleton Screens** ([nngroup.com](https://www.nngroup.com/articles/skeleton-screens/)) + **Smashing real-time dashboards** ([smashingmagazine.com](https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/)) — **per-widget skeletons** beat one global spinner (~20% faster perceived); narrate via `aria-live`; reorder animations under 300ms; respect reduced motion; surface data-freshness + transparent reconnect banners.
- **WCAG C39 reduced motion** ([w3.org](https://www.w3.org/WAI/WCAG22/Techniques/css/C39)) + **Adrian Roselli accessible skeletons** ([adrianroselli.com](https://adrianroselli.com/2020/11/more-accessible-skeletons.html)) — author the **static final state as default**; gate motion behind `@media (prefers-reduced-motion: no-preference)`; `aria-busy` + polite live region; skeleton DOM `aria-hidden`.
- **Web-worker GeoJSON parse** (Rich Harris) — a multi-MB `JSON.parse` blocks the main thread (~2000ms cited); parse off-thread **at the point the raw bytes arrive** (fetch `ArrayBuffer`, or the raw WS frame), not after the data is already a parsed object.
- **PMTiles / FlatGeobuf / deck.gl** — viable growth paths, but **GL JS 3.19 lacks native PMTiles vector sources** (needs ~3.21), and deck.gl is a flashier second render path. *Defer/skip for two-city scale.*

---

## 4. Recommended Layout: Right-Docked Insight Panel + Bottom Omnibox

### 4.1 The chosen direction

**The map is the protagonist; the conversation is its right-hand reading column; the omnibox is the always-available door into it.** We adopt the **Right-Docked Insight Panel** (the judge panel's winner, 202) and graft the single most-recommended idea from the runners-up — a **bottom-center "Ask" omnibox** as the default query entry — to close the winner's one real gap.

Three surfaces, three unambiguous homes:

| Surface | Home | Why |
|---|---|---|
| **Map** | Center column (`1fr`, min ~640px) | The work. Always interactive, never blurred, never occluded, never sat-under. |
| **Controls** (geography search, taxonomy filters, layer toggles) | Left-anchored floating Toolbar over the map | Left is where the eye lands; controls and map stay unobstructed. |
| **Conversation + answers** | Resizable, collapsible **right** column; summoned via a bottom-center **omnibox** | Right is the conventional reading/detail edge (Figma/Felt/Linear). Omnibox is the map-first quick door. |

### 4.2 Rationale vs. the alternatives

| Alternative (judge score) | Why not the base | What we grafted from it |
|---|---|---|
| **Right-Docked Insight Panel (202)** | — | **Chosen base.** Grid-sibling dock driven by `sidebarWidthStore`; collapse-to-tab; keyboard-resizable separator; map flexes, never occluded. |
| **Adaptive Map-First Canvas (192)** | Bundled the layout fix with a large independent program (palette + worker + clustering + PMTiles + mini-cards) as one high-risk proposal; surface proliferation undercut the restraint thesis. | **Bottom-center omnibox** as default entry; **⌘K command palette**; **map-anchored mini-cards** (Side Peek). |
| **Bottom Spotlight Omnibox + Answer Cards (182)** | Centered answer cards rise **over** the region `MapActionBlock` just `fitBounds`'d to — the narration occludes the spatial answer; **bottom-center over-subscription** (omnibox + cards + timeline + attribution). | **Two-role composer** (hero → sticky footer); **ephemeral-by-default, persistent-by-pin** answer model; HeadlineStatsBar as the empty-state resting summary. *We explicitly budget the bottom edge (§4.6) so we do not inherit its crowding.* |
| **Left Tool Rail + Right Conversation Panel (181)** | Heaviest chrome (~1100px to show everything); VS Code workbench register reads cold/bureaucratic for a lay civic audience; three concurrent query entry points create "where do I type?" ambiguity. | **Contextual bottom timeline strip** (Kepler/Unfolded); consolidating Toolbar groups; explicit per-panel collapsed boolean. |

**Net:** The winner gives the cleanest, lowest-surprise fix to the corner-card complaint and activates the most dead-but-built infra. Its killer flaw — no lightweight default query entry — is exactly what the #2/#3 omnibox solves. So the recommended layout is **winner dock + grafted omnibox + grafted Side Peek (with an explicit state machine) + grafted contextual timeline strip, governed by a bottom-edge budget.**

### 4.3 Desktop wireframe

```
DEFAULT / COLLAPSED  (map-first; conversation summoned via the omnibox)
┌──────────────────────────────────────────────────────────────────────────┬──┐
│  ░ Toolbar (floating, left-anchored, OVER map) ░            [⌘K hint]      │▸ │ ← launcher tab
│  ┌────────────────────────────────────┐                                   │Ask│   (focusable button,
│  │ 🔍 Geography…  [Filters] [Layers]   │                                   │  │    aria-expanded=false,
│  └────────────────────────────────────┘                                   │  │    aria-controls=insight)
│                                                                           │  │
│                    M A P   (full width · the protagonist)                 │  │
│                    ── heat density (low/mid) · per-capita choropleth ──    │  │
│                                                                           │  │
│   ┌────────┐                                                              │  │
│   │ + − ⌖  │ nav (bottom-LEFT)                                            │  │
│   └────────┘        ╭──────────────────────────────────────────╮         │  │
│                     │ 🔍 Ask about gun violence in Philly…  ⌘K │ ← omnibox│  │
│                     ╰──────────────────────────────────────────╯ (HERO)  │  │
│   (timeline strip HIDDEN while omnibox is hero)        © Mapbox (bottom-R)│  │
└──────────────────────────────────────────────────────────────────────────┴──┘

EXPANDED  (after a query — right dock open, map flexes, omnibox → sticky footer)
┌──────────────────────────────────────────────────────┬─────────────────────┐
│  ░ Toolbar ░                                          ║│ ▌Philadelphia ⤢ ⟨⟩│ ← header: context,
│                                                       ║│  down 6% YTD  auto▾│   collapse, mode
│              M A P  (1fr, min ~640px;                 ║│─────────────────────│
│              its own grid CELL — panel never overlaps;║│ "Philadelphia logged│
│              NO setPadding for the dock)              ║│  1,204 shootings…"  │ ← plain-language
│                                                       ║│ ┌Stat┐ ┌─ Chart ──┐ │   headline first
│         heat / query points                          ║│ └────┘ └──────────┘ │
│            ╭ mini-card (click feature) ╮              ║│ [InsightBlock]      │
│            ╰──────────────────────────╯              ║│ [SourceBlock ▸ as of]│ ← provenance required
│                                          resize ‖────╜│─────────────────────│
│  ◀ Timeline strip ▶ (shown only with incident layer)  │ 🔍 Ask a follow-up… │ ← sticky composer
└──────────────────────────────────────────────────────┴─────────────────────┘
  ◀──── map column (1fr, min 640px) ────▶  ◀ panel: var(--okn-panel) 380–720 ▶
  ‖ = role=separator: drag = setSidebarWidth; ArrowLeft/Right nudge 16px; dbl-click → 460
  Grid is gated on a client-mounted flag to avoid a first-paint width/collapse jump (§4.8).
```

### 4.4 Mobile wireframe

```
COLLAPSED (peek)                      EXPANDED (bottom sheet; map peeks above)
┌───────────────────────────┐        ┌───────────────────────────┐
│ ░ Toolbar ░  🔍  ▤  ⌘     │        │        M A P  (peek)       │ ← stays visible
│                           │        │      heat density          │   at partial heights
│         M A P             │        ├───────────────────────────┤
│      (full screen)        │        │  ═══ (grab handle <button>)│ ← real button,
│      heat density         │        │  Philadelphia · down 6%    │   aria-expanded,
│                           │        │  ┌ StatBlock ┐ ┌ Chart ┐   │   keyboard collapse
│  (timeline HIDDEN in peek)│        │  └───────────┘ └───────┘   │
├───────────────────────────┤        │  [SourceBlock ▸]           │
│  ═══ (grab handle <button>)│        ├───────────────────────────┤
│  🔍 Ask…              ⌘    │ ← peek │  🔍 Ask a follow-up…       │ ← composer in
│  ░ safe-area inset ░       │  64px  │  ░ safe-area + attr. pad ░ │   thumb zone
└───────────────────────────┘        └───────────────────────────┘
  Snap points: peek (64px) / half (50vh) / full (88vh). Heights measured with visualViewport
  so the iOS soft keyboard lifts both composer and sheet (§4.6 / Risk 17).
  Timeline strip SUPPRESSED at half/full (sheet owns the bottom). No ⌘K palette on touch.
```

### 4.5 Where each surface lives

- **Map canvas** — center grid cell in `ChatMapApp.tsx`, min width ~640px so it is never squeezed below legibility. **The panel is a sibling grid column, so the map cell never sits under it — therefore we do *not* add `map.setPadding` for the desktop dock.** Driving padding-right from the panel width (the overlay-era trick) would *double-count*: the grid already shrinks the map cell, and extra padding would push `fitBounds`/centering leftward away from a panel that does not overlap, mis-centering every `MapActionBlock` result. `map.setPadding` (bottom) is used **only for genuinely overlapping surfaces**: the bottom omnibox/timeline strip and the mobile bottom sheet's visible peek (and the optional floating window). Chat results land here first via `MapActionBlock` (set `shooting-query` source + `fitBounds`) — the map is the primary answer surface; the panel narrates.
- **Floating Toolbar (controls)** — left-anchored, absolutely positioned over the map's top-left, freed from chat. Its `md:w-[min(38rem,calc(100vw-29rem))]` magic number is **deleted**; the grid now reserves the panel's space, so the toolbar can left-anchor naturally (`left-3 top-3 max-w-[min(38rem,calc(100%-1.5rem))]`).
- **Right Insight Panel (expanded)** — right grid column, flush to the viewport edge, width bound to `sidebarWidthStore`. Header: connection pill + context label + collapse button + `auto/research` mode toggle (existing `queryModeStore`). Body: the existing block library on a restrained card stack, led by a plain-language headline sentence. Footer: sticky composer. `role="region"` + `aria-label="AI insight panel"`; `aria-live="polite"` for streaming.
- **Bottom-center Ask omnibox** — slim composer over the map with safe-area + Mapbox-attribution clearance. Hero in the empty state; on submit it expands the dock (desktop) / sheet (mobile) and migrates into the panel footer.
- **Slim launcher tab (collapsed)** — ~40px vertical tab on the right edge; a real focusable `<button>` (`aria-expanded`, `aria-controls`) labelled "Ask" that restores the last `sidebarWidthStore` width. **Badges** on error/zero-result while collapsed (§4.7).
- **Selection-driven detail (Side Peek)** — a **map-anchored mini-card** (`MapFeatureCard`) for quick context on a clicked feature, with "View full detail ▸" promoting into the right panel. The panel arbitrates between `conversation` and `detail` via an **explicit, persisted state machine** (§4.7).
- **Contextual timeline strip** — thin collapsible bottom strip (Kepler/Unfolded), bound to `dateRangeStore` (in `filterStore.ts`); auto-shows only when an incident layer is active **and** the omnibox is not in hero state, dims the current incomplete period, and is suppressed on mobile half/full sheet (§4.6).

**Base vs. query render semantics (the split is *not* a no-op).** Today a chat result *replaces* the `shooting` corpus, so the user sees only the query subset. After splitting into `shooting-base` (static 3-yr corpus) + `shooting-query` (dynamic), both sources would render simultaneously — painting the full corpus *underneath* every query result, the opposite of today's behavior. **Contract:** while a query is active (`mapLayerStore.queryActive`), set `visibility:none` on the base heat + point layers and render only `shooting-query-*`; on clear/reset/new-empty-query, restore the base. This is explicit state in `mapLayerStore` and the `wsGeoJSON` effect, with a smoke test asserting the base is not double-rendered during a query (§5.2, Risk 3b).

### 4.6 Interaction model and the bottom-edge budget

- **Summon:** click the bottom-center omnibox, click the right-edge launcher tab, or press **⌘K / Ctrl+K** (opens the command palette focused on the composer). A query submitted from the omnibox auto-expands the panel.
- **Dismiss:** the header collapse button or **Esc** collapses the panel to the launcher tab; **focus returns to the tab**. State persisted via a new `sidebarCollapsedStore` boolean (separate from width — do not infer collapse from near-min width; react-resizable-panels #234).
- **Resize:** a 6px left-edge handle is a `role="separator"` (`aria-orientation="vertical"`); drag sets `sidebarWidthStore` (clamped 380–720); **ArrowLeft/ArrowRight** nudge in 16px steps; **double-click** resets to 460; visible focus ring. `map.resize()` fires **on width settle only** (reuse the existing debounced `chatMode→resize` effect in `Map.tsx`), never during continuous drag.
- **⌘K command palette:** `cmdk` wrapped in a focus-trapping Radix Dialog. Two roles — free-text query (same `websocketStore` flow) **and** contextually-scoped "search + act" commands read from nanostores: switch city, toggle heatmap/census/resources/businesses, set `auto`/`research`, run a saved query. Esc closes and restores focus to the trigger. A persistent `⌘K` hint chip keeps it discoverable — and it is *never the only entry point* (the visible omnibox is primary).
- **Connection-aware composer.** The omnibox subscribes to the WebSocket lifecycle (`wsState` connection status). While `disconnected`/`reconnecting`, the composer's submit is `aria-disabled` with an inline status ("Reconnecting…"), queued input is preserved, and the `⌘K` palette mirrors the same disabled-submit state. On reconnect, submit re-enables and any queued query can be sent. This makes the always-visible omnibox honest about whether a query can be sent (§4.7).
- **Ephemeral vs. persistent:** answers render in the dock by default and are disposable; an explicit **Pin** / "Compare" / "Open dashboard" promotes them and (in `research` mode) mounts the orphaned `HeadlineStatsBar` / `TimelinePanel` / `SummaryStatsPanel`. A lightweight history keeps disposability from losing analyst work.
- **Keyboard order:** map controls → panel header → blocks → composer → launcher tab. The panel is a labelled `region` (a complementary landmark — **not** a focus-trapping `dialog`, so keyboard/SR users are never trapped away from the map).
- **Motion:** panel expand/collapse and width changes are a short tween (~200–250ms ease-out). Under `prefers-reduced-motion`, the panel snaps with **opacity only**, streaming reveals jump to final state, and the 26-stage status degrades to a single calm status line. Streaming answers are announced through a **debounced, atomic** polite `aria-live` region — announce the *settled* answer, never raw token-by-token.

**Bottom-edge layout budget + z-order (resolves the over-subscription critique).** The bottom edge is finite; only the following may occupy it, with fixed lanes and minimum clearances:

| Lane | Occupant | Rule |
|---|---|---|
| bottom-**left** | map nav (`+ − ⌖`) | always; ~12px inset |
| bottom-**right** | Mapbox attribution (legally required) | always visible; never overlapped; on desktop it sits in the map cell to the left of the dock |
| bottom-**center** | Ask omnibox (hero) / sticky composer (footer) | always; min 16px clearance from nav (left) and attribution (right); safe-area + `visualViewport` aware |
| above composer | timeline strip | **hidden** when omnibox is in **hero** state; shown only when an incident layer is active **and** a query/answer exists (footer state); **suppressed on mobile** at half/full sheet |

On mobile, **at most one** bottom occupant is "tall": the peek omnibox (collapsed) or the sheet (expanded) — never both, and the timeline never competes in the thumb zone. This is the explicit budget the rejected runner-up lacked.

### 4.7 The Side-Peek state machine + error/empty/reconnect states

`panelViewStore` holds **structural** view (persisted): `resting` | `conversation` | `detail`.

```
            submit query / open omnibox
 resting ─────────────────────────────────▶ conversation
    ▲                                          │  ▲
    │ esc / collapse                  click map │  │ "back to conversation"
    │                                  feature  ▼  │
    └──────────────────────────────────────── detail (MapFeatureCard promoted)
```

- On entering `detail`, move focus into the detail heading and announce the context change via `aria-live` ("Showing details for census tract 42101"). "Back to conversation" restores the transcript and focus to the last composer position. Quick context stays in the *anchored* `MapFeatureCard`; only "View full detail ▸" swaps the panel — so a single click never silently replaces the thread.

**Feedback states (orthogonal to structural view).** Error, empty-result, and reconnect are *not* new structural views; they reuse `ChatBox`'s existing system-feedback precedence (`error > clarification > reconnect > status`) rendered in the conversation view's feedback zone, with three additions that matter specifically because the dock is **collapsed-by-default**:

| Condition | Surfacing |
|---|---|
| **Query error / failure** | Dock auto-expands (or, if the user just collapsed it, the launcher tab shows an error **badge** + the omnibox shows an inline error). Distinct visual treatment (`--negative`), a retry affordance (reuse `errors/` retry), and the map is left unchanged with an explicit note that nothing was applied. |
| **Zero-result (valid query, no incidents)** | An explicit **empty state** ("No incidents match those filters in this area / period") — visually distinct from a failure, domain-sensitive (no incidents is a real, meaningful answer, not an error). `shooting-query` is set to an empty FeatureCollection and the base remains hidden until reset; the headline sentence states the zero plainly. |
| **WebSocket disconnect / reconnect while collapsed** | The reconnect banner routes to a **visible surface even when collapsed**: a small status pill near the omnibox and a launcher-tab badge, not only inside the hidden transcript. Composer submit is disabled meanwhile (§4.6). |

This guarantees a failed, empty, or disconnected response never leaves the user staring at an unchanged map with no feedback.

### 4.8 Layout file-by-file change list (real paths, reused identifiers)

| File | Change | Reuses |
|---|---|---|
| `src/components/core/ChatMapApp.tsx` | Replace the overlay layout (map `div` + separately-fixed `ChatSidePanel`) with a top-level CSS grid: `grid-cols-[minmax(640px,1fr)_var(--okn-panel,0px)]`. Map + `ChatSidePanel` become grid **siblings**. Set `--okn-panel` from `useStore(sidebarWidthStore)` when expanded, `0px` when `sidebarCollapsedStore`. **Gate the grid template on a client-mounted flag** (render the default/expanded frame until mounted, then apply persisted width/collapse in a `useEffect`, without animating the first apply) to avoid a first-paint layout jump and hydration mismatch from the persisted stores. Do **not** pass panel width to `Map` for padding (grid reserves the column). Mount `AskOmnibox` (bottom-center), `CommandPalette` (root), `TimelineStrip` (bottom). Wire every new surface behind the existing `isEmbedMode` guard per the embed matrix (§4.9). | `sidebarWidthStore`, `desktopChatModeStore`, `queryModeStore`, `chatLayoutActions`, `isEmbedMode` |
| `src/components/chat/ChatSidePanel.tsx` | Convert the desktop branch from `fixed left-4 top-4 w-[408px] rounded-2xl shadow-lg` overlay → full-height docked column (`h-full w-full border-l border-line-1`, no fixed positioning, no corner radius/shadow). Add: left-edge resize handle (`role="separator"`, keyboard-resizable, calls `chatLayoutActions.setSidebarWidth`); header collapse button (`aria-expanded`/`aria-controls` → `sidebarCollapsedStore`); `role="region"` + `aria-label`; Esc-to-collapse + focus restoration; debounced atomic `aria-live="polite"`; error/empty/reconnect feedback per §4.7. Replace the `x:-440` slide with a width/opacity tween. Upgrade the mobile `sheet` branch to peek/half/full snaps with a real `<button>` handle, measured against `visualViewport`. Drop the local `matchMedia`; read `chatModeStore` (driven by `syncViewportMode`). Render the `panelViewStore` state machine. | `chatModeStore`, block library, `ChatBox` header/feedback precedence |
| `src/stores/chatLayoutStore.ts` | Add persisted `sidebarCollapsedStore` boolean + `toggleSidebarCollapsed`/`setSidebarCollapsed`. Add `panelViewStore` (`'resting'\|'conversation'\|'detail'`, persisted). Wire `desktopChatModeStore`/`openSidebar` so `sidebar` is the real docked mode; keep `floating` as an explicit opt-in (or mark for removal with `floatingPosition/Dimensions/DockEdgeStore`). Keep `syncViewportMode` as the single 767px source of truth. **Add a one-time persistence migration** (§4.10): namespace/version the persisted keys, coerce any stale `desktopChatModeStore==='floating'` → `'sidebar'`, and default the new collapsed/view stores. | existing store; retires dead `floating` ambiguity |
| `src/components/toolbar/Toolbar.tsx` | Remove `md:w-[min(38rem,calc(100vw-29rem))]` and the `justify-end md:left-auto` dodge. Left-anchor naturally (`left-3 top-3 max-w-[min(38rem,calc(100%-1.5rem))]`). Register its toggles into the command-palette registry. Keep the `PanelToggle` `aria-expanded`/`aria-controls` pattern. | `PanelToggle`, `MapControlPanel`, `MapDataFilter` |
| `src/components/chat/AskOmnibox.tsx` **(NEW)** | Slim bottom-center composer; hero (empty) → migrates into panel footer on submit (two-role). **Reuses `ChatInput` as-is, including the `QueryModeToggle` already rendered inside it (line 119) — it does NOT mount a second `QueryModeToggle`** (that would double the control). `role="search"`; `⌘K` hint chip; safe-area + attribution clearance + `visualViewport` keyboard handling; connection-aware disabled submit (§4.6); submits via the existing `websocketStore` flow. | `ChatInput` (incl. its `QueryModeToggle`), `wsActions`, `wsState` connection status |
| `src/components/command/CommandPalette.tsx` **(NEW)** | `cmdk` in a focus-trapping Radix Dialog. Free-text query + a command registry reading city/active-layers/`queryModeStore` from nanostores ("search + act"). Esc restores focus to trigger. Lazy-loaded on first ⌘K. | nanostores; new deps `cmdk`, `@radix-ui/react-dialog` |
| `src/components/chat/MapFeatureCard.tsx` **(NEW)** | Anchored mini-card for clicked features (tract/resource/point). Reuses `Stat/Insight/Source` blocks; shows **rate-with-denominator** + lived-proximity context (Turf buffer + census); "View full detail ▸" sets `panelViewStore='detail'`. Replaces the token-ignoring, mouse-only context menu in `Map.tsx` (keyboard-reachable). | `StatBlock`, `InsightBlock`, `SourceBlock`, Turf.js |
| `src/components/timeline/TimelineStrip.tsx` **(NEW)** | Contextual bottom date scrubber bound to `dateRangeStore`; surfaces orphaned `TimelinePanel` data; dims the current incomplete period; obeys the bottom-edge budget (hidden in hero/peek, suppressed at half/full sheet); honors reduced motion. | `dateRangeStore`, `TimelinePanel` |
| `src/components/dashboard/HeadlineStatsBar.tsx`, `TimelinePanel.tsx`, `SummaryStatsPanel.tsx` | Mount the currently-orphaned panels in the panel's `research` view (gated by `queryModeStore==='research'`), led by the plain-language headline sentence. Import + place only — no rebuild. | existing dashboard components |
| `src/components/blocks/*` (`InsightBlock` canonical) | No structural change. Reuse as the answer-column content on a restrained responsive card stack; ensure `SourceBlock`/provenance renders on every stat/chart. | block library |
| `src/styles/global.css` | Add omnibox/palette/launcher utilities (elevation, safe-area-inset helpers) on the existing `surface/ink/line/accent` tokens + `.text-*` scale, including explicit `.dark` values for the new surfaces and **basemap-contrast** treatments (§4.11). Retire legacy `--chat-*` / `.apple-notion-*` aliases as components migrate. Verify dim chrome meets WCAG contrast. | semantic token system, `:focus-visible`, reduced-motion guard |

**New runtime dependencies (layout):** `cmdk`, `@radix-ui/react-dialog`.

### 4.9 Embed-mode matrix (`?embed=true`)

Embed mode already ships (`page.tsx ?embed=true`; `ChatMapApp` guards chat with `!isEmbedMode` at lines 478/520). The redesign makes the omnibox the *primary* query entry and the dock the answer home, so each new surface must be wired behind `isEmbedMode` **deliberately**. Default intent: **embedded maps are view-only**, with a single opt-in to a query-enabled embed (`?embed=true&chat=1`).

| Surface | `embed=true` (default, view-only) | `embed=true&chat=1` (query-enabled embed) | Reason |
|---|---|---|---|
| Map + data layers | render | render | The embed's whole point. |
| Loading surfaces (skeleton / progress sliver / status pill / `aria-live`) | render | render | Loading UX is independent of chat. |
| Floating Toolbar (layer toggles, geography) | render (read-only-friendly) | render | Layer toggles are useful in an embed. |
| Timeline strip | render if incident layer active | render | Contextual, non-chat. |
| Ask omnibox | **hidden** | render (bottom-center) | Query entry is opt-in. |
| Launcher tab + right dock | **hidden** | render | Answer home only when chat is enabled. |
| ⌘K command palette | **hidden** (no global key listener registered) | render | Avoid hijacking keys in a host page. |

This is captured as a small `embedSurfaces(isEmbedMode, chatEnabled)` capability object that each new component reads, so embed behavior is explicit rather than incidental.

### 4.10 Persisted-store migration

Existing users carry persisted values from prior builds. The migration is small but mandatory:
- **`chatModeStore` semantics change, value does not.** `'sidebar'` previously rendered a fixed card; it now renders the docked column. The persisted value `'sidebar'` stays valid — no coercion needed, only the rendering changes.
- **`desktopChatModeStore`** may hold `'floating'` if ever seeded. If `floating` is retired, coerce stale `'floating'` → `'sidebar'` on read; if kept as opt-in, leave it but ensure it has a real UI entry point.
- **New stores** `sidebarCollapsedStore` (default `false`) and `panelViewStore` (default `'resting'`) are additive and safe for existing users.
- **Key namespacing/versioning.** Bump the persistent-atom key namespace (e.g. prefix `okn:v2:`) for any store whose meaning changed, or add a one-time read-time migration that validates the stored value against the new enum and falls back to the default. This prevents a malformed/legacy value from wedging the new grid. `sidebarWidthStore` already clamps to 380–720 on read, so out-of-range legacy widths self-heal.

### 4.11 Dark mode + basemap-contrast for the new surfaces

The new surfaces float **over the Mapbox canvas**, whose style luminance is set by the map (light/dark), **independent of the app's `.dark` theme**. So contrast must be guaranteed against the *basemap*, not only against app surface tokens:
- **`MapSkeletonOverlay`** — the city-tint must not vanish or invert on a dark basemap. Drive the tint and shimmer dots from luminance-aware values (a semi-opaque scrim that adapts: a dark scrim over light tiles, a light scrim over dark tiles) rather than a fixed `~12%` of `--surface-*`. Provide explicit `.dark` token values *and* a basemap-style check so the overlay is legible in both.
- **`MapProgressBar`** — `--accent` fill on a `--line-1` track; verify the accent passes contrast on both light and dark basemaps at the top edge; provide the `.dark` accent.
- **`AskOmnibox` / launcher tab / `MapStatusPill` / `MapFeatureCard`** — these are token cards (`--surface-1`), but floating over arbitrary map tiles they need a defined elevation: a `--line-2` hairline ring + a token shadow + an optional subtle backdrop blur so text never sits directly on busy tiles. Confirm the `.dark` surface/line/ink values (already defined in `global.css`) yield ≥ WCAG AA for body and control text in both themes and over both basemap luminances.

---

## 5. Responsive Loading Architecture

This is the **reconciled** progressive-loading architecture: the unanimous core plus deliberate tie-breaks, corrected for the heatmap/cluster incompatibility, the base/query visibility semantics, and where parsing actually occurs.

### 5.1 Data-flow diagram (query/intent → transport → source → layer → reveal)

```
COLD BOOT  (Phase 0 — client-only)
  useMapbox.initMap → initializeMap() → map 'load'
    → addEmptySources(×5) + setupMapLayers (ALL data layers declared opacity:0)
    → setIsLoaded(true)                 ◄── MAP INTERACTIVE NOW, never blurred
    → mapLayerStore.basemap='ready'  (mapPhase: cold-boot → hydrating)
  surfaces: MapSkeletonOverlay (cold-boot only, aria-hidden) · aria-busy=true · live:"Loading map…"

  parallel independent hydration — Promise.allSettled (replaces Promise.all+serial awaits):
    hydrateShootingBase → fetch ARRAYBUFFER → [worker parse+trim if >1MB] → FeatureCollection
        → setData('shooting-base')  (un-clustered)
        → revealLayer(shooting-heat: opacity 0→t, 250ms / 0ms reduced-motion)
        → mapLayerStore.shooting='ready' · incidentCount=N
    hydrateCensus / hydrateResources / hydrateBusinesses → setData own source → 'ready'|'empty'|'error'
        → per-toggle loading chip in Toolbar (fetching→ready, inline retry on error)
  mapPhase → interactive-ready ⇒ progress sliver hides · aria-busy=false · live:"Map ready, N incidents"

LOD BY ZOOM  (Phase 0 — UN-clustered base)
  z<14  shooting-heat (density)   │   z>=14  shooting-point (individual, obfuscated)
  (heatmap reads the UN-clustered base — do NOT cluster this source)
  optional Phase 2: z~10–14 counted bubbles from a SEPARATE clustered source (never the heatmap's)

CHAT / NL QUERY  (existing WebSocket — Phase 0 retarget + visibility arbitration)
  ChatInput / AskOmnibox → WebSocketManager.sendChatMessage → backend
    WS onmessage: JSON.parse(event.data)  ◄── parse already happens HERE, on main thread
        (large-frame option: hand RAW frame to worker — see §5.2)
    → StatusPayload(generating_map) → mapLayerStore.dynamic='fetching', queryActive=true
        → base heat+point layers visibility:'none'   ◄── prevents corpus double-render
        + wsCurrentStatus(progress, 26-stage) → MapProgressBar (determinate) + MapStatusPill
        ◄── scoped to the QUERY layer only · no canvas blur · map stays interactive
    → ResponsePayload(GeoJSON, already parsed object in wsState.geoJSONData)
    → useMapbox wsGeoJSON effect → updateShootingData → setData('shooting-query')  ◄── small source
    → revealLayer cross-fade (dim out 150ms → fade in 250ms) · visibleIncidentCount=N
       (request-token gated: only the latest accepted payload reveals/announces — §Risk 7)
    → live:"Map updated, N incidents" → mapLayerStore.dynamic='ready'
  CLEAR / RESET / zero-result → shooting-query=empty, queryActive=false → base layers visible again

VIEWPORT  (Phase 2 — needs bbox backend)
  moveend (debounce 300ms) → getBounds()+zoom → buildHeatmapUrl(bbox,zoom)
    → AbortController cancels stale → ARRAYBUFFER → worker parse → setData('shooting-base') slice

CHEAP UPDATES  (Phase 1)
  hover/select census or point → setFeatureState({source,id},{hovered/selected})
    → static paint expr reads ['feature-state','selected'] → GPU repaint, no expression recompile
    (reconcile promoteId 'id' vs the geoid the fill paint keys on — §Risk 8)

ESCAPE HATCH  (Phase 3 — flagged, dormant, >~150k pts)  deck.gl MapboxOverlay
```

### 5.2 Staged loading plan per layer, with decision rationale

| Layer | Technique | Why this technique |
|---|---|---|
| **Coordination state** (NEW `mapLayerStore`) | Non-persisted nanostore: `Record<'basemap'\|'shooting'\|'census'\|'resources'\|'businesses'\|'dynamic', LayerStatus>` (`'idle'\|'fetching'\|'parsing'\|'revealing'\|'ready'\|'empty'\|'error'`); atoms `incidentCount`/`visibleIncidentCount`, **`queryActive`** (drives base visibility), a monotonic `requestToken`, computed `mapPhase`, actions `setLayerStatus`/`setQueryActive`/`resetForRefresh`, and an `announcement` atom for `aria-live`. | Single source of truth every UX surface and effect-guard reads. **Must NOT be persisted** — persisting would restore stale `loading`/`error`/`queryActive` on reload. |
| **First paint** (incident base) | In `initMap`, `setIsLoaded(true)` immediately after `load` + `addEmptySources` + `setupMapLayers`, **before any fetch**. Replace `setupMapSources`' `Promise.all([shooting,census]) + serial awaits` with independent hydrators via `Promise.allSettled`. Guard downstream effects on per-layer `mapLayerStore==='ready'`, not the single `isLoaded`. | Today `isLoaded` gates on the combined incident+census fetch (resources/businesses already soft-fail). Empty sources render instantly; highest-impact, lowest-effort fix and the precondition for retiring the blur. |
| **Incident source split + visibility arbitration** | Split `shooting` → **`shooting-base`** (static 3-yr corpus, `maxzoom:12`, `buffer:0`, `promoteId:'id'`) + **`shooting-query`** (empty dynamic). Repoint `updateShootingData` + the `wsGeoJSON` effect to `shooting-query`. **When `queryActive`, set `visibility:'none'` on the base heat+point layers and render only `shooting-query-*`; restore on clear/reset/zero-result.** | **Tie-break → two-source split.** Chat results currently `setData` the **large base**, re-tiling the whole corpus per query — the real "Updating map…" jank. **This is NOT a no-op retarget:** today's flow *replaces* the corpus, so without hiding the base, every query would double-render 3 years of history underneath it. Smoke test asserts no double-render while `queryActive`. |
| **LOD by zoom (heatmap density + obfuscated points) — NOT clustered** | Keep the **un-clustered** `shooting-base` feeding `shooting-heat` (density, z<14, fades out by ~z16 as today) and `shooting-point` (circle, `minzoom:14` as today, retained) for individual **obfuscated** points at neighborhood zoom. **Do NOT set `cluster:true` on `shooting-base`.** | **Correctness fix.** A `cluster:true` GeoJSON source exposes only cluster features (with `point_count`) plus leftover unclustered points, so a **heatmap layer reading it renders distorted, lumpy density** — a well-known GL JS incompatibility, not tuning. Heatmap-at-low-zoom + points-only-at-z≥14 already delivers the responsible-display property (no individual victim points at city zoom) **without** clustering. |
| **Optional counted clusters (Phase 2)** | If product wants counted bubbles in the mid-zoom band (z~10–14), add a **separate, dedicated** clustered source `shooting-clusters` (`cluster:true`, `clusterRadius:50`, `clusterMaxZoom:13`, `clusterProperties` summing fatal/non-fatal, `promoteId:'id'`) feeding **only** `shooting-cluster` + `shooting-cluster-count`. Cluster click → `getClusterExpansionZoom` → `easeTo`. | Keeps clustering **off the heatmap's source**. Cost: it duplicates the corpus in a second GeoJSON source (extra parse/memory), so it is optional and gated behind a product decision — the heatmap+minzoom spine already covers the civic and performance needs. |
| **Census blocks (choropleth)** | Hydrate independently; encode fills as **per-capita rates** (join incidents to census population), denominator in legend/tooltip. Cheap hover/select via `setFeatureState` (Phase 1). | **Domain-mandatory** (choropleth area-size bias + territorial stigma). `maxzoom:12`. |
| **Community resources** | Independent hydrator; `'ready'\|'empty'`. Static-cacheable (Phase 3 IndexedDB by city+version). | Rarely changes; never blocks first paint. |
| **Businesses** | Independent hydrator, gated `minzoom~12`; Phase 2 viewport-bounded. | Densest, least essential at city zoom; defer to neighborhood zoom. |
| **Reveal mechanism** | Data layers declared at `opacity:0` in `layers.ts` with matching `*-opacity-transition` duration. `revealLayer(map, layerId, opacityProp, target, reducedMotion)` sets duration `reducedMotion ? 0 : 250` then the opacity. Dynamic query layer cross-fades (dim out 150ms → fade in). | **GPU paint-opacity transitions**, not CSS blur. No second render path; degrades to instant swap under reduced motion. Layers **must** start at opacity 0 or the first frame pops. |
| **Off-main-thread parse** | New Comlink worker (`geojson.worker.ts` + client wrapper): parse `ArrayBuffer` + round coords to 6dp + strip unused `IncidentProperties` → transferable. **Scope it to the FETCH/hydration path** (fetch → `ArrayBuffer` → worker), which is the real multi-MB main-thread stall. **For the WS query path the parse already happens inside `WebSocketManager.onmessage` (`JSON.parse(event.data)`), so routing the already-parsed `geoJSONData` object through a worker offloads nothing.** To actually offload a large query frame, change `WebSocketManager` to hand the **raw frame string/ArrayBuffer** to the worker (parse+trim there, return transferable), gated to large frames; small frames parse inline. If that WS change is out of scope, do not claim the worker smooths the chat stream. | **Corrected scope.** The win is at the point raw bytes arrive, not after they are a JS object. |
| **Cheap per-feature updates** | Replace `updateCensusSelection`'s full `fill-color` expression rebuild with `setFeatureState({source:'censusBlocks',id},{selected/hovered})` + a static paint expression reading `['feature-state','selected']`. **Reconcile `promoteId:'id'` with the `geoid` the fill paint currently keys on** (`["get","geoid"]`). | Current code rewrites the entire `fill-color` expression every mousemove. `feature-state` mutates one feature on the GPU with no recompile — but the id the handler sets must match `promoteId`, or selection silently no-ops. |
| **Viewport-bounded fetch** (Phase 2) | Extend `HeatmapQuery`/`buildHeatmapUrl` with `bbox` + zoom; thread `AbortSignal` into `fetchHeatmapGeoJSON` (keep the url-keyed cache + in-flight dedupe, bbox in the key). Debounced (300ms) `moveend` reads `getBounds()` with ~10% over-fetch margin, aborts in-flight, `setData`s the slice into `shooting-base`. | **Backend-gated.** Query-param-only change; ~20x perceived-load improvement for one-neighborhood-at-a-time usage. Over-fetch margin prevents edge-clipping of heat. |
| **Deferred growth path** (Phase 3, documented not built) | `tippecanoe -zg -r1` → `.pmtiles` for the historical corpus + census; `idb` cache for static layers (city+version); deck.gl `MapboxOverlay` behind a flag for >~150k points. | **Skip deck.gl as default** (flashier second render path the domain rejects). **PMTiles deferred** — GL JS 3.19 lacks native PMTiles vector sources (needs ~3.21 or the `mapbox-pmtiles` shim). |

### 5.3 Non-blocking loading-state design (replaces the full-map blur)

Replace `Map.tsx`'s `mapLoading ? 'filter blur-sm'` + blocking `MapLoader` with four quiet, token-consistent surfaces — all reduced-motion-aware, respecting Mapbox attribution/control safe-areas, and **legible over either basemap luminance** (§4.11):

- **`MapSkeletonOverlay`** — `aria-hidden` luminance-adaptive scrim + 5–7 shimmer dots over the metro centroid, **visible only while `mapPhase==='cold-boot'`**; shimmer disabled under reduced motion.
- **`MapProgressBar`** — 2px top sliver (`--accent` on `--line-1`): indeterminate on `cold-boot`/`hydrating`, **determinate** = `wsCurrentStatus.progress` on `refreshing`; static under reduced motion. Sits at the absolute top edge, above the Toolbar in z-order.
- **`MapStatusPill`** — token pill reusing the 26-stage `getStageInfo` vocabulary; hidden at `interactive-ready`; respects attribution/nav safe-areas. Scoped to the dynamic query layer — "Updating map…" no longer blurs the canvas.
- **One visually-hidden `role="status" aria-live="polite"` region** fed by the `announcement` atom — the real announcement workhorse ("Loading incidents…", "Map updated, N incidents", "No incidents match…") because `aria-busy` support is uneven across screen readers. `aria-busy` is bound to `mapPhase` on the map container as a supplement.

### 5.4 Loading file-by-file change list

| File | Change |
|---|---|
| `src/stores/mapLayerStore.ts` **(NEW)** | The coordination store from 5.2 (status record, counts, `queryActive`, `requestToken`, `mapPhase`, actions, `announcement`). **Not** persisted. |
| `src/hooks/useMapbox.tsx` | In `initMap`: `setIsLoaded(true)` right after `load` + `addEmptySources` + `setupMapLayers`, **before** fetching. Replace the awaited `Promise.all+serial` `setupMapSources` with independent hydrators via `Promise.allSettled`, each updating `mapLayerStore` + calling `revealLayer`. Re-guard census/resources/business effects on per-layer `'ready'`. Repoint `updateShootingData` + the `wsGeoJSON` effect to `shooting-query`; **toggle base-layer `visibility` from `queryActive`**. Phase 2: debounced `moveend` with an `AbortController` ref. Expose a `setMapPadding` helper used **only for bottom overlapping surfaces** (omnibox/timeline/sheet), **not the desktop dock**. |
| `src/utils/map/mapbox.ts` | Split `setupMapSources`: keep the empty-source add loop as `addEmptySources(map)` returning immediately; extract the fetch/`setData` blocks into exported `hydrateShootingBase`/`hydrateCensus`/`hydrateResources`/`hydrateBusinesses`, each tolerating failure independently (drop the `Promise.all`/serial form). Add `revealLayer(...)`. Repoint `updateShootingData` to `shooting-query`. **Keep `shooting-base` un-clustered**; if the optional counted-cluster band is built, add a separate `shooting-clusters` source + `setupClusterEvents` (cluster click → `getClusterExpansionZoom` → `easeTo`). Add a coord-round(6dp)/property-prune helper applied before `setData` when not done in the worker. |
| `src/config/mapbox/sources.ts` | Split `shooting` → `shooting-base` (un-clustered, `maxzoom:12`, `buffer:0`, `promoteId:'id'`) + `shooting-query` (empty dynamic, `promoteId:'id'`). Add `maxzoom:12` to `censusBlocks`/`communityResources`/`businesses`. Optional (Phase 2): `shooting-clusters` (clustered) as a dedicated source. Add a flagged future PMTiles base-URL entry (Phase 3). |
| `src/config/mapbox/layers.ts` | Point `shooting-heat` (keep, z<14 density) + `shooting-point` (keep `minzoom:14`) at `shooting-base`; add parallel `shooting-query-heat`/`shooting-query-point` on `shooting-query`. Every data layer: reveal opacity `0` + matching `*-opacity-transition` duration (250). Optional `shooting-cluster` + `shooting-cluster-count` on the dedicated clustered source only. |
| `src/components/charts/Map.tsx` | Remove `mapLoading ? 'filter blur-sm'` and `<MapLoader/>`. Bind `aria-busy` to `mapPhase`. Mount `MapSkeletonOverlay` (cold-boot), `MapProgressBar`, `MapStatusPill`, and the visually-hidden `role="status"` live region. Drive map **bottom** padding from the omnibox/timeline/sheet heights (`setMapPadding`) — **not** from the dock width. Migrate the context menu off raw `bg-white`/`gray-700`/`blue` to tokens and make it keyboard-reachable (becomes `MapFeatureCard`). **Phase-0 placement note:** under the *old* chrome the status pill keeps the existing loader's location (clear of the still-present top-left card and top Toolbar) and the top sliver renders above the Toolbar in z-order; the bottom-LEFT nav relocation moves in **Phase 1** with the layout (§6). |
| `src/stores/websocketStore.ts` | In the `generating_map` status handler: also set `mapLayerStore.dynamic='fetching'` + `queryActive=true` (keep `mapLoading` for back-compat; it now feeds only the scoped pill/sliver). In the geoJSON handler: set `dynamic='revealing'`, `incidentCount=data.features.length`, push announcement, then `'ready'`. On zero-result: set `shooting-query` empty, emit the empty-state announcement, leave `queryActive` until reset. On error/complete: reset `dynamic='idle'`, restore base. |
| `src/utils/websocket.ts` | **(WS-worker option)** If offloading large query frames, change `onmessage` to detect frame size and hand the **raw** string/`ArrayBuffer` to the worker for parse+trim before invoking `onGeoJSONUpdate`; small frames keep the inline `JSON.parse`. Otherwise unchanged. |
| `src/utils/map/mapUpdates.ts` | Replace `updateCensusSelection`'s full `fill-color` rebuild with `setFeatureState` + static paint expression; add a diff helper toggling only changed geoids; **reconcile `promoteId:'id'` vs the keyed `geoid`**. |
| `src/utils/map/heatmap.ts` (Phase 2) | Extend `HeatmapQuery` + `buildHeatmapUrl` with `bbox`/`zoom`; add optional `AbortSignal`; keep url-keyed cache + in-flight dedupe (bbox in the key). |
| `src/services/businessService.ts` (Phase 2) | Add `bbox`/`zoom` + `AbortSignal` so the viewport-gated `moveend` fetch only pulls in-view businesses above `minzoom~12`. |
| `src/workers/geojson.worker.ts` + `src/utils/map/geojsonClient.ts` **(NEW, Phase 1)** | Comlink-exposed `parse(arrayBuffer) → FeatureCollection` (round 6dp, strip unused props, transferable). Invoked from hydration (and, if the WS change lands, from `WebSocketManager` for large raw frames). Client-only (SSR guard for Next 15 / Turbopack worker URL resolution). |
| `src/components/loaders/MapSkeletonOverlay.tsx`, `MapProgressBar.tsx`; `src/components/status/MapStatusPill.tsx` **(NEW)**; `MapLoader.tsx` **(RETIRE)** | The non-blocking surfaces from 5.3. Remove `MapLoader` from `Map.tsx`. |

**New runtime dependencies (loading):** `comlink` (Phase 1). **Phase 3 (build-time / deferred):** `pmtiles`, `tippecanoe`, `idb`, a GL JS 3.19→3.21 bump. **Explicitly skipped:** `deck.gl` (documented behind a dormant flag only).

---

## 6. Phased Implementation Roadmap

Sequenced so the **biggest perceived improvement ships first** and the layout refactor (highest blast radius) is decoupled from the loading wins.

### Phase 0 — Progressive loading (client-only, zero backend) · the headline win

| Task | Effort | User-visible payoff |
|---|---|---|
| Add non-persisted `mapLayerStore` (coordination glue, incl. `queryActive`/`requestToken`) | S | — (enabler) |
| Decouple `isLoaded` from data; `Promise.allSettled` independent hydration; re-guard downstream effects | M | **Map is interactive in <1s** instead of waiting on the combined incident+census fetch |
| Delete `blur-sm` + `MapLoader`; add `MapSkeletonOverlay` / `MapProgressBar` / `MapStatusPill` / `aria-live`, **placed to clear the still-present corner card + top Toolbar** (nav relocation deferred to Phase 1) | M | Calm, legible loading; the map never freezes behind a blocking blur |
| Split `shooting` → `shooting-base` / `shooting-query`; repoint chat path; **toggle base visibility on `queryActive`** | M | **"Updating map…" jank gone**; query results no longer double-render the historical corpus |
| LOD-by-zoom on the **un-clustered** base (heat density z<14, obfuscated points z≥14); prune props + 6dp coords | M | Fast city-zoom paint; no individual victim points at city scale; correct (un-distorted) density |

**Ships first because** it is the largest perceived-performance gain at the least cost, has no backend or layout dependency, and is the precondition for everything calm that follows. Phase-0 surfaces are explicitly validated against the *current* chrome (§5.4 Map.tsx note); the only placement that depends on the new layout — the bottom-left nav cluster — moves with Phase 1.

### Phase 1 — Layout (the corner-card fix)

| Task | Effort | User-visible payoff |
|---|---|---|
| `ChatMapApp` overlay → CSS grid (client-mount-gated to avoid first-paint jump); `ChatSidePanel` fixed card → docked right column bound to `sidebarWidthStore`; `map.resize()` on width settle (no dock `setPadding`) | L | **The chat stops floating over the corner** — a docked column the map flexes around, never occluded |
| `AskOmnibox` (bottom-center default entry, two-role, reuses `ChatInput`'s `QueryModeToggle`); bottom-edge budget wired | M | Map-first, thumb-zone quick query; no bottom-edge crowding |
| Resize separator (keyboard) + launcher tab + `sidebarCollapsedStore` + `role="region"` + Esc + focus mgmt | M | Reclaim full map in one click; fully keyboard/SR operable panel |
| Error / empty-result / reconnect dock states + launcher badge + connection-aware composer | M | Failed/empty/disconnected responses always surface, even collapsed |
| Persisted-store migration + embed-mode matrix wiring | S | No layout-jump/hydration mismatch for returning users; embed behaves deliberately |
| Delete Toolbar `29rem` magic number; left-anchor naturally | S | Toolbar geometry governed by the grid, not a guess |
| Mobile sheet → peek/half/full + real `<button>` handle + `visualViewport` keyboard handling; centralize 767px in `syncViewportMode` | M | Map stays visible; composer rides above the iOS keyboard; no breakpoint drift |
| Side-Peek `panelViewStore` state machine + `MapFeatureCard` (keyboard-reachable, replaces context menu) | M | Click a feature for detail beside the map without losing the thread |

### Phase 2 — Polish + viewport loading (needs query-param-only backend)

| Task | Effort | User-visible payoff |
|---|---|---|
| `bbox`+zoom on `/heatmap-geopoints` & `/businesses/map`; debounced `moveend` + `AbortController` + 10% margin | M | ~20x faster city-scale loads; only in-view data transfers |
| Comlink worker (fetch/hydration path; optional raw-WS-frame path for large query frames) | M | No main-thread stall on big payloads |
| `setFeatureState` census hover/select (with `promoteId`/`geoid` reconcile) | S | Snappy hover/selection (no expression recompile) |
| Optional counted clusters via a dedicated clustered source (mid-zoom band) | S | Counted bubbles at z~10–14 without breaking the heatmap |
| `⌘K` command palette (`cmdk` + Radix Dialog, lazy-loaded) folding Toolbar toggles | M | Power-user keyboard path; declutters the map chrome |
| Mount orphaned dashboards in `research` mode; plain-language headline first; `SourceBlock` on every stat | M | Comprehension-first, citation-forward answers (civic trust) |
| Per-capita rate choropleth + denominator in legend; obfuscation labels | M | Removes territorial-stigma misread; dignity + legal compliance |
| Reduced-motion + colorblind-safe palette pass; debounced atomic `aria-live`; dark-mode/basemap-contrast audit | M | Accessible, serious tone; legible over any basemap |
| **Discoverability telemetry** (omnibox engagement, dock open-rate by entry point, ⌘K usage, time-to-first-query) | S | Evidence for the discoverability claim (§6 note) |

**Telemetry note:** the redesign is justified by discoverability, so it must be measured. Instrument: omnibox focus/submit; dock open broken down by `{omnibox, launcher tab, ⌘K}`; ⌘K open rate; panel collapse/expand; time-to-first-query; coachmark dismissal. Compare against a pre-deploy baseline. This requires the analytics decision in Open Question 11.

### Phase 3 — Growth path (build pipeline + dep bump; do only if data outgrows GL JS)

| Task | Effort | User-visible payoff |
|---|---|---|
| `tippecanoe → .pmtiles` static tiles for corpus + census; bump GL JS to ~3.21 (or `mapbox-pmtiles` shim) | L | Base layers load only what's on screen, zero tile-server ops |
| `idb` IndexedDB cache for static layers keyed by city+version | M | Instant city-switches and repeat visits |
| deck.gl `MapboxOverlay` wired behind a flag, **off** | M | Dormant escape hatch for a future >~150k-point national dataset |

---

## 7. Risks & Mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Overlay → grid conversion of `ChatMapApp` is the highest-blast-radius change** (Toolbar, drawers, context menu, attribution, embed mode all position against it). | Land Phase 0 (loading) first. Do the grid conversion behind a feature flag; visual-regression the embed-mode guard, drawers, and attribution placement. |
| 2 | **Narrow-laptop squeeze (<1100px):** min-map(640) + min-panel(380) is unsatisfiable. | Below ~1100px, **auto-collapse** the panel to the launcher tab; enforce min map width so widening never squeezes the center below ~640px. Cover with snapshot tests. |
| 3a | **Two-source split desyncs base vs. query layers** if any consumer still assumes one `shooting` source (heatmap toggle, click bindings, `updateShootingData`). | Audit every `shooting`-source reference; the heatmap toggle must toggle layer ids across both sources. Smoke test asserts both sources/layer sets exist after init. |
| 3b | **Base corpus double-renders under every query** (today a query *replaces* the corpus; after the split both render). | `queryActive` sets base heat+point `visibility:'none'`; restore on clear/reset/zero-result. Smoke test asserts the base is not painted while a query is active. |
| 4 | **Clustering breaks the heatmap** — a `cluster:true` source exposes only cluster/leftover features, distorting heatmap density. | **Do not cluster the heatmap's source.** Keep `shooting-base` un-clustered (heat + points). Counted clusters, if built, live on a separate dedicated clustered source feeding only cluster circle/count layers. |
| 5 | **Removing the global `isLoaded` gate** lets effects run before a source has data → "source not found". | Each downstream effect guards on per-layer `mapLayerStore==='ready'`, never the single `isLoaded`. |
| 6 | **Reveal "pop"** if a layer is added at full opacity then reset. | Declare every data layer at `opacity:0`; transition up; `duration:0` under reduced motion — and verify the reduced-motion cross-fade is still *noticeable* so users don't miss that the map updated. |
| 7 | **Race / back-pressure on rapid chat follow-ups** — WS query layers reveal/announce out of order; cross-fades stack faster than they complete. | Monotonic `requestToken` in `mapLayerStore`: only the **latest accepted** payload reveals/announces; supersede in-flight cross-fades by snapping to final before starting the next; `AbortController` per fetch source. Last-write-wins for display; gated counts. |
| 8 | **`feature-state` needs ids that survive `setData`** — `censusBlocks` has `promoteId:'id'` but the fill paint keys on `['get','geoid']`. | Reconcile `promoteId` with the geoid the handlers key on, or selection silently no-ops. Verified mismatch in current `sources.ts`/`layers.ts`. |
| 9 | **`aria-live` fed raw streaming tokens floods SR users.** | Announce the **settled, atomic** answer (debounced), not token-by-token; `polite`, never `assertive` except errors. |
| 10 | **Panel labelled as `dialog` with focus-trap traps keyboard/SR users away from the map.** | Make it a **complementary `region`** landmark, not a focus-trapping dialog. Only the ⌘K palette traps focus (it is genuinely modal). |
| 11 | **Comlink worker offloads nothing on the WS query path** — the frame is already `JSON.parse`'d in `WebSocketManager.onmessage` before it reaches `geoJSONData`. | Scope the worker to the **fetch/hydration** path (raw `ArrayBuffer`). To help the WS path, move the raw-frame parse into the worker via a `WebSocketManager` change (large frames only); otherwise do not claim it smooths the chat stream. SSR-guard; verify `Transferable` is actually transferred. |
| 12 | **`mapLayerStore` accidentally persisted** restores stale `loading`/`error`/`queryActive` on reload. | Plain `atom`, **not** `persistentAtom`; keep it out of the persisted set. |
| 13 | **Count-up on gun-violence figures reads as gamified.** | Static final number is the default; motion ≤400ms, no bounce/color-flash, gated behind `prefers-reduced-motion: no-preference` (WCAG C39). |
| 14 | **Loading/omnibox surfaces overlap legally-required Mapbox attribution or the Toolbar.** | The bottom-edge budget (§4.6) fixes lanes and min clearances; attribution bottom-right, nav bottom-left, omnibox bottom-center; sliver/pill respect safe-areas. |
| 15 | **New deps (`cmdk`, `@radix-ui/react-dialog`, `comlink`) add bundle weight + a registry to sync.** | Code-split the palette (lazy-load on first ⌘K); keep the registry small and driven by existing nanostores. |
| 16 | **Returning users relearn where the chat lives** (corner card → right dock). | One-time dismissible "Chat now docks on the right" coachmark on first post-deploy visit; `⌘K` hint chip aids discovery. |
| 17 | **Persisted layout stores cause a first-paint layout jump / React hydration mismatch** — the grid SSRs with default (width 460, expanded) then rehydrates `sidebarWidthStore`/`sidebarCollapsedStore` from localStorage. | Gate the grid template on a client-mounted flag: render the default frame until mounted, then apply persisted width/collapse in `useEffect` without animating the first apply. Call out `persistentAtom` hydration explicitly alongside the worker SSR guard. |
| 18 | **Persistence migration** — legacy/stale persisted values (`desktopChatModeStore==='floating'`, out-of-range widths, missing new keys) wedge the new grid. | Version/namespace the persisted keys; coerce stale `floating→sidebar`; `sidebarWidthStore` already clamps; new collapsed/view stores default safely (§4.10). |
| 19 | **Embed mode silently becomes view-only or leaks an unexpected chat surface.** | Explicit embed matrix (§4.9): each new surface reads an `embedSurfaces(isEmbedMode, chatEnabled)` capability; default view-only, opt-in `?embed=true&chat=1`. |
| 20 | **iOS Safari soft keyboard covers the omnibox/sheet; `100vh` mis-measures.** | Use `visualViewport` (height + offsetTop) to position the omnibox/composer/sheet above the keyboard; use `dvh` units (already in the codebase); reposition on `visualViewport` resize. |
| 21 | **New floating surfaces are illegible over a dark basemap** (the map style luminance is independent of app `.dark`). | Luminance-adaptive skeleton scrim; token cards get a `--line-2` ring + shadow + optional backdrop; audit contrast over both basemap luminances and both app themes (§4.11). |

---

## 8. Open Questions for the Product Owner

1. **Backend `bbox`+zoom support.** Phase 2 viewport fetching needs `/heatmap-geopoints` and `/businesses/map` to accept a bounding box + zoom (query-param-only). Timeline? Until then we over-fetch the city window.
2. **Provenance metadata contract.** Citation-forward `SourceBlock`s require the WebSocket backend to pass source link + data vintage ("as of") + a one-line methodology/limits note alongside each result. Is this contract change in scope, and what fields can the backend commit to?
3. **Per-capita denominators.** Encoding choropleth fills as rates requires joining incidents to census population per block. Does that join exist server-side, or must the client compute it? How do we handle small-population blocks (smoothing vs. a minimum-population threshold)?
4. **Location obfuscation.** Are incident coordinates already snapped to block centroids upstream, or must the client obfuscate? Legally/ethically required and must be labelled — confirm the source of truth.
5. **Base/query result semantics.** Confirm the intended behavior when a query is active: should the historical corpus be fully **hidden** (matching today's replace) or shown as a **faint context layer** beneath the query result? The plan defaults to hidden; a "faint context" option is a one-line visibility/opacity change if preferred.
6. **Counted mid-zoom clusters.** Do we want counted cluster bubbles at z~10–14 (a second, duplicated clustered source with extra memory cost), or is the heatmap-density + obfuscated-points LOD sufficient? The heatmap path is correct and cheaper; clusters are optional polish.
7. **GL JS version bump (Phase 3).** PMTiles native vector sources need GL JS ~3.21 (project pinned at 3.19). Minor bump, or the `mapbox-pmtiles` shim to stay on 3.19? Gates the static-tile growth path.
8. **`floating` chat mode.** The store defines a full floating/drag/dock contract that is currently dead. (a) Wire a UI entry point for a movable window, or (b) delete the dead path? Recommendation: defer as an explicit opt-in, not the default — and migrate any stale persisted `floating` value to `sidebar`.
9. **Embed mode intent.** Confirm the default: view-only embeds with an opt-in `?embed=true&chat=1` query-enabled embed (the matrix in §4.9). Are there host-page key-binding constraints that should keep ⌘K disabled even in the chat-enabled embed?
10. **Default city + cross-city compare.** Open on a chosen city, last-used (persisted), or geolocated? Is a side-by-side Philadelphia-vs-Chicago compare mode in scope for `research` mode, or later?
11. **Analytics infrastructure.** The redesign is justified by discoverability and must be measured (omnibox engagement, dock open-rate by entry point, ⌘K usage, time-to-first-query). Is there an analytics pipeline we can emit to, and is event collection acceptable for this civic audience (privacy posture)?
12. **Data freshness & export.** The research strongly recommends a "Get the data" export (filtered/obfuscated view + attribution + methodology) and visible "last updated." Is exportable open data a product commitment to design for now?
13. **Two-tier audience emphasis.** Everytown's model leads with plain-language summaries for community members, then exposes incident-level data for advanced users. Which audience is the default view optimized for at launch?
14. **Onboarding for ⌘K / omnibox.** For a non-expert civic audience, how much onboarding (coachmarks, empty-state prompts, example questions) is acceptable without cluttering the map-first default?

---

### Appendix: confirmed reuse surface (do not rebuild)

- **Stores** (`src/stores/chatLayoutStore.ts`): `sidebarWidthStore` (persisted, clamp 380–720, default 460, self-healing on read) + `setSidebarWidth`; `desktopChatModeStore` + `openSidebar`/`openFloating`/`toggleFloatingSidebar`; `chatModeStore` (default `"sidebar"`); `floatingPosition/Dimensions/DockEdgeStore`; `queryModeStore`; `syncViewportMode` (single 767px source). `dateRangeStore` lives in `src/stores/filterStore.ts`.
- **Verified current behaviors** (so revisions stay correct): `setupMapSources` runs `Promise.all([fetchHeatmapGeoJSON, fetchGeoJSON(censusBlocks)])` then **sequential** soft-failing `await`s for resources/businesses, all before `setIsLoaded`. `WebSocketManager.onmessage` does `JSON.parse(event.data)` and hands an **already-parsed** `FeatureCollection` to `onGeoJSONUpdate`; `wsState.geoJSONData` is a parsed object. A chat result **replaces** the `shooting` corpus (`updateShootingData → setData('shooting')`). `shooting-heat` (heatmap) + `shooting-point` (circle, `minzoom:14`) both read one **un-clustered** `shooting` source. `censusBlocks` declares `promoteId:'id'` but the fill paint keys on `['get','geoid']` (mismatch). `QueryModeToggle` is rendered **inside** `ChatInput` (line 119).
- **Tokens** (`src/styles/global.css`): `--surface-0..3`, `--ink-1..3`, `--line-1/2`, `--accent`/`--accent-soft`, `--positive/--negative/--warn` with full `.dark` override; `.text-title/.text-body/.text-caption/.text-label`; global `:focus-visible` ring; `prefers-reduced-motion` guard; `animate-chat-fade-in`. Retire legacy `--chat-*` / `.apple-notion-*` aliases as components migrate.
- **Blocks** (`src/components/blocks/*`): `InsightBlock` (canonical card wrapper) + `Text/Chart/Stat/Table/MapAction/FollowUp/Source/Comparison` + `ArtifactCard/ArtifactModal`.
- **Dashboards** (`src/components/dashboard/*`): `HeadlineStatsBar`, `TimelinePanel`, `SummaryStatsPanel` — built but orphaned, ready to mount; `IncidentTaxonomyFilters` already in use.
- **Chat** (`src/components/chat/ChatBox.tsx`): connection-state pill, context-label bar, system-feedback precedence (error > clarification > reconnect > status), contextual suggestions, collapse toggle — reusable header/feedback logic for the docked panel, omnibox, and the error/empty/reconnect states.
