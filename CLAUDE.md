# OKN - Open Knowledge Network: Gun Violence Intelligence Platform

## What This Is
An interactive split-screen (AI chat + map) web app for exploring gun violence incidents in Philadelphia and Chicago, overlaid with census demographics and community resources.

## Tech Stack
- **Framework**: Astro 5 (SSR/static hybrid) + React 19
- **Styling**: Tailwind CSS 4 + HeroUI component library
- **Maps**: Mapbox GL 3.17
- **State**: Nanostores (lightweight reactive stores, persisted to localStorage)
- **Real-time**: WebSocket for bidirectional chat + streaming responses
- **Charts**: Recharts + Turf.js (geospatial)
- **Package manager**: pnpm

## Commands
- `pnpm dev` — start dev server on `0.0.0.0:4321`
- `pnpm build` — production build
- `pnpm preview` — preview production build
- `node server.js` — standalone production server (serves `dist/`)

## Architecture Overview

```
src/
├── components/       # React/Astro components (see ARCHITECTURE.md)
│   ├── core/         # ChatMapApp.tsx — master orchestrator (start here)
│   ├── chat/         # ChatBox, ChatBubble, ChatInput, PresetQuestions
│   ├── charts/       # 16 visualization components + Map.tsx
│   ├── buttons/      # Feature toggles (heatmap, census, resources, filters)
│   ├── drawers/      # Modal/drawer overlays for census & resource details
│   ├── dropdowns/    # City selector, model/endpoint selector
│   ├── filters/      # Date range, demographic filter UI
│   ├── loaders/      # Loading/typing indicators
│   ├── status/       # Real-time progress indicator (26 stages)
│   ├── errors/       # Error display + retry
│   └── utils/        # Navbar, dark mode toggle
├── config/           # Mapbox config, WebSocket URL config
├── data/             # Preset questions, fallback data
├── hooks/            # useMapbox, useChat, useExpandMap
├── icons/            # SVG icon components
├── layouts/          # Astro layout wrapper
├── pages/            # index.astro (entry), api/, health.json
├── services/         # API clients (census, community resources)
├── stores/           # Nanostores (websocket, census, filter, darkmode)
├── styles/           # Global CSS
├── types/            # TypeScript definitions for all API contracts
└── utils/            # WebSocket manager, chat helpers, map utils, formatters
```

## Key Entry Points
1. **`src/pages/index.astro`** — page entry, renders ChatMapApp
2. **`src/components/core/ChatMapApp.tsx`** — master component (~1500 LOC), orchestrates everything
3. **`src/stores/websocketStore.ts`** — central state: messages, GeoJSON, filters, loading, status
4. **`src/utils/websocket.ts`** — WebSocketManager class, handles connection + message parsing
5. **`src/services/server.ts`** — API clients for census demographics + community resources

## Data Flow
```
User query → ChatInput → WebSocketManager.sendChatMessage()
  → Backend (/chat or /sparql)
  → Streaming: StatusPayload → StreamPayload → ResponsePayload
  → wsState updates (messages, GeoJSON, charts)
  → ChatBubble renders text + chart; Map updates GeoJSON layer
```

## External APIs
- **WebSocket chatbot** at `PUBLIC_CHATBOT_URL` env var (endpoints: `/chat`, `/sparql`)
- **Census API** at `PUBLIC_CENSUS_API_URL` — demographic data by GEOID
- **Community Resources API** at `PUBLIC_COMMUNITY_RESOURCES_API_URL` — food/shelter/mental health services

## Environment Variables (in .env)
- `PUBLIC_MAPBOX_TOKEN` — Mapbox GL access token
- `PUBLIC_CHATBOT_URL` — WebSocket backend URL
- `PUBLIC_CENSUS_API_URL` — Census demographics API base URL
- `PUBLIC_COMMUNITY_RESOURCES_API_URL` — Community resources API base URL
