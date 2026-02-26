# Architecture Deep Dive

## Components Detail

### `core/ChatMapApp.tsx` — The Orchestrator
The main component that ties everything together. Manages:
- Split-screen layout (chat 50% / map 50%, expandable)
- WebSocket lifecycle (connect on mount, disconnect on unmount)
- Census tract selection state + modal visibility
- Community resource detail modals
- Coordinates map GeoJSON updates when chat responses arrive

### Chat System (`chat/`)
| Component | Purpose |
|---|---|
| `ChatBox` | Message history container, scroll management, preset questions |
| `ChatBubble` | Renders a single message — supports markdown, base64 chart images, quick action buttons |
| `ChatInput` | Text input with 1000-char limit validation |
| `PresetQuestions` | 35 curated questions across 8 categories (Overview, Time, Place, Demographics, Income, Comparison, Resources, General) |

### Charts (`charts/`)
16 visualization components for demographic/statistical data:
- **Demographics**: AgeDistribution, GenderDistribution, RaceDistribution, PopulationPyramid, AgeMixDonut, AgeCohortBars, RaceStackedBar100
- **Income**: IncomeDistribution, IncomeBucketBar
- **Aggregate**: AgeHistogramChart, OknLineChart (time series)
- **Layout**: ChartCard (wrapper), FloatingChart, OknCharts (multi-chart grid), OknDemographicChart, KpiCard
- **Map.tsx**: Mapbox GL container with context menu for census tract interaction

### Buttons (`buttons/`)
Feature toggle buttons that sit on the map:
- `HeatmapLayerButton` — toggle incident heatmap
- `CensusLayerButton` — toggle census block boundaries
- `CommunityResourcesLayerButton` — toggle resource markers (filterable by type)
- `FilterButton` — open filter modal
- `CitySelectButton` — switch Philadelphia/Chicago
- `ExpandMapButton` — fullscreen map
- `ClearCensusButton` — deselect all census tracts
- `GenerateSummaryButton` — AI summary of selected data

### Drawers/Modals (`drawers/`)
Overlay panels for detailed data:
- `TractInsightModal` — full demographic breakdown (age, race, gender, income charts)
- `CommunityResourcesModal` — resource detail (hours, phone, eligibility, languages)
- `OknChartsDrawer` — statistical insights panel
- `CensusDataDrawer` — census data table
- `CensusTractInfo` — census tract info card

### Filters (`filters/`)
- `MapDataFilter` — main filter modal
- `DateRangeSection` — calendar date picker
- `FilterOptionsSection` — multi-select (wound type, race, fatality, etc.)
- `FilterSelectionSection` — shows applied filters with remove buttons

---

## State Management (Nanostores)

### `websocketStore.ts` — Central Store
```
wsState = {
  isConnected        // WebSocket connection status
  messages[]         // Full chat history
  streamingMessages  // Active streaming chunks (by messageId)
  geoJSONData        // Current map GeoJSON (incidents)
  loading            // Chat loading state
  mapLoading         // Map data loading state
  mapStatusMessage   // Status text ("Executing query...")
  remainingQuestions // 10-question session limit
  currentFilters     // Applied filters
  currentEndpoint    // "CHAT" or "SPARQL"
  currentStatus      // 26-stage progress pipeline
}
```

### `censusStore.ts`
- `selectedCensusBlocks[]` — persisted census tract GEOIDs

### `filterStore.ts`
- `filtersStore` — active filter selections
- `dateRangeStore` — date range with calendar state

### `darkmodeStore.ts`
- `isDarkmode` — persistent dark/light toggle

---

## WebSocket Protocol (`utils/websocket.ts`)

Messages use envelope format: `{ type, payload }`

| Type | Direction | Payload | Purpose |
|---|---|---|---|
| `status` | Server→Client | `{ stage, message, progress }` | 26-stage progress updates |
| `stream` | Server→Client | `{ chunk, messageId, isComplete }` | Streaming text response |
| `response` | Server→Client | `{ task, message, data, chart }` | Final response with optional GeoJSON + chart |
| `error` | Server→Client | `{ code, message, retryable }` | Error with retry hint |
| `chat_message` | Client→Server | `{ query, context }` | User query |
| `filter_update` | Client→Server | `{ filters }` | Filter change |
| `census_update` | Client→Server | `{ census_tracts }` | Census selection change |

---

## API Clients (`services/server.ts`)

### Census Demographics
- `GET /api/census-tract/{geoid}` — full demographic profile
- `GET /api/census-tract/{geoid}/summary` — simplified data
- `GET /api/census-tract/{geoid}/income` — income distribution

### Community Resources
- `GET /v1/resources` — paginated list (filters: city, type, availability, zipcode, search)
- `GET /v1/resources/{id}` — detail page
- `GET /v1/resources/map` — GeoJSON for map layer

---

## Map System

### Config (`config/mapbox.ts`)
Defines Mapbox sources and layers:
- **incidents**: GeoJSON point source → circle + heatmap layers
- **census-blocks**: GeoJSON polygon source → fill + line layers
- **community-resources**: GeoJSON point source → symbol layer

### Hooks
- **`useMapbox`** — initializes map, manages source/layer lifecycle, reacts to store changes
- **`useChat`** — chat message handling, send/receive, streaming assembly
- **`useExpandMap`** — fullscreen toggle state

### Utils (`utils/map/`)
- `mapbox.ts` — map init, source/layer setup, GeoJSON updates
- `mapUpdates.ts` — census visibility, selection highlighting
- `heatmap.ts` — fetch heatmap GeoJSON with date range filtering

---

## Multi-City Support
The app supports Philadelphia (default) and Chicago. Switching cities:
1. `CitySelectButton` triggers city change
2. Filters reset, map viewport changes
3. WebSocket reconnects to city-specific data
4. Heatmap + census layers reload for new city
