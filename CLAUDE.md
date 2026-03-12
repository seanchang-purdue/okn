# OKN - Open Knowledge Network: Gun Violence Intelligence Platform

## What This Is
An interactive map-first web app with floating/dockable AI chat for exploring gun violence incidents in Philadelphia and Chicago, overlaid with census demographics and community resources.

## Tech Stack
- **Framework**: Next.js 15 (App Router) + React 19
- **Styling**: Tailwind CSS 4 + HeroUI component library
- **Maps**: Mapbox GL 3.19
- **State**: Nanostores (lightweight reactive stores, persisted to localStorage)
- **Real-time**: WebSocket for bidirectional chat + streaming responses
- **Charts**: Recharts + Turf.js (geospatial)
- **Package manager**: pnpm

## Commands
- `pnpm dev` — start dev server with Turbopack on port 4321
- `pnpm build` — production build
- `pnpm start` — start production server on port 4321

## Architecture Overview

```
src/
├── app/              # Next.js App Router
│   ├── layout.tsx    # Root layout with providers
│   ├── page.tsx      # Main page (renders ChatMapApp)
│   ├── providers.tsx # HeroUIProvider client wrapper
│   └── api/health/   # Health check route
├── components/       # React components
│   ├── core/         # ChatMapApp.tsx — master orchestrator (start here)
│   ├── chat/         # ChatBox, ChatBubble, ChatInput, PresetQuestions,
│   │                 # FloatingChatWindow, ChatSidePanel, ChatBubbleButton,
│   │                 # FloatingPresetQuestions, ChatModeToggle
│   ├── charts/       # 16 visualization components + Map.tsx
│   ├── buttons/      # Feature toggles (heatmap, census, resources, filters)
│   ├── drawers/      # Modal/drawer overlays for census & resource details
│   ├── dropdowns/    # City selector, model/endpoint selector
│   ├── filters/      # Date range, demographic filter UI
│   ├── loaders/      # Loading/typing indicators
│   ├── status/       # Real-time progress indicator (26 stages)
│   ├── errors/       # Error display + retry
│   └── utils/        # Navbar, dark mode toggle, DarkmodeInitializer
├── config/           # Mapbox config, WebSocket URL config
├── data/             # Preset questions, fallback data
├── hooks/            # useMapbox, useChat
├── icons/            # SVG + TSX icon components
├── services/         # API clients (census, community resources)
├── stores/           # Nanostores (websocket, census, filter, darkmode, chatLayout)
├── styles/           # Global CSS
├── types/            # TypeScript definitions for all API contracts
└── utils/            # WebSocket manager, chat helpers, map utils, formatters
```

## Key Entry Points
1. **`src/app/page.tsx`** — page entry, renders ChatMapApp
2. **`src/components/core/ChatMapApp.tsx`** — master component, orchestrates everything
3. **`src/stores/websocketStore.ts`** — central state: messages, GeoJSON, filters, loading, status
4. **`src/stores/chatLayoutStore.ts`** — chat UI mode: collapsed/floating/panel
5. **`src/utils/websocket.ts`** — WebSocketManager class, handles connection + message parsing

## Chat Layout Modes
The app uses a full-screen map with three chat modes (managed by `chatLayoutStore`):
1. **Collapsed** (default) — full-screen map + floating chat bubble (bottom-right) + preset question pills
2. **Floating** — draggable chat window overlaying the map
3. **Panel** — 420px right side panel that pushes the map left

## Data Flow
```
User query → ChatInput → WebSocketManager.sendChatMessage()
  → Backend (/chat or /sparql)
  → Streaming: StatusPayload → StreamPayload → ResponsePayload
  → wsState updates (messages, GeoJSON, charts)
  → ChatBubble renders text + chart; Map updates GeoJSON layer
```

## External APIs
- **WebSocket chatbot** at `NEXT_PUBLIC_CHATBOT_URL` env var (endpoints: `/chat`, `/sparql`)
- **Server API** at `NEXT_PUBLIC_SERVER_URL` — census demographics, community resources, charts

## Environment Variables (in .env)
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` — Mapbox GL access token
- `NEXT_PUBLIC_CHATBOT_URL` — WebSocket backend URL
- `NEXT_PUBLIC_SERVER_URL` — REST API base URL
- `NEXT_PUBLIC_SHOW_QUICK_ACTIONS` — Toggle quick action buttons
