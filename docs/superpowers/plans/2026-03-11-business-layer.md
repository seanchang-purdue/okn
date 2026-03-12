# Business Layer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a business heatmap/point layer to the map with business type filtering, integrated into the existing Tools panel.

**Architecture:** Follows the existing community resources pattern exactly — types, service client, Mapbox source/layer config, map utils, hook state, and toolbar wiring. The business layer is a new GeoJSON source rendered as a circle layer with a heatmap option, toggled from MapControlPanel alongside Heatmap/Census/Resources.

**Tech Stack:** Next.js 15, Mapbox GL 3.19, TypeScript, Nanostores, HeroUI

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/types/business.ts` | TypeScript interfaces for business API responses |
| Create | `src/services/businessService.ts` | REST client for `/businesses/map` and `/businesses/types` |
| Modify | `src/config/mapbox/sources.ts` | Add `businesses` source + endpoint |
| Modify | `src/config/mapbox/layers.ts` | Add `businessCircles` layer definition |
| Modify | `src/utils/map/mapbox.ts` | Fetch business data, add layer setup, click/hover events, popup |
| Modify | `src/hooks/useMapbox.tsx` | Add business layer state, visibility toggle, type filter |
| Modify | `src/components/map/MapControlPanel.tsx` | Add "Businesses" toggle + type filter dropdown |
| Modify | `src/components/toolbar/Toolbar.tsx` | Pass business props through to MapControlPanel |
| Modify | `src/components/core/ChatMapApp.tsx` | Wire business state from useMapbox to Toolbar |

---

## Chunk 1: Data Layer (Types + Service)

### Task 1: Create business types

**Files:**
- Create: `src/types/business.ts`

- [ ] **Step 1: Create the type definitions**

```typescript
// src/types/business.ts

/**
 * Properties attached to each business GeoJSON feature
 */
export interface BusinessProperties {
  id: number;
  company: string;
  business_type: string;
  naics_code: string;
  naics_description: string;
  address: string;
  census_tract: string;
}

/**
 * A single business GeoJSON feature
 */
export interface BusinessFeature extends GeoJSON.Feature {
  geometry: GeoJSON.Point;
  properties: BusinessProperties;
}

/**
 * Response from GET /businesses/map
 */
export interface BusinessesGeoJSON extends GeoJSON.FeatureCollection {
  features: BusinessFeature[];
  metadata: {
    count: number;
  };
}

/**
 * A single entry from GET /businesses/types
 */
export interface BusinessTypeInfo {
  business_type: string;
  count: number;
}

/**
 * Response from GET /businesses/types
 */
export interface BusinessTypesResponse {
  types: BusinessTypeInfo[];
}

/**
 * Query parameters for GET /businesses/map
 */
export interface BusinessMapFilters {
  city?: string;
  business_type?: string[];
  naics_code?: string[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/business.ts
git commit -m "feat: add TypeScript types for business API"
```

---

### Task 2: Create business service client

**Files:**
- Create: `src/services/businessService.ts`

- [ ] **Step 1: Create the service**

```typescript
// src/services/businessService.ts
import type {
  BusinessesGeoJSON,
  BusinessTypesResponse,
  BusinessMapFilters,
} from "../types/business";
import { apiUrl } from "../config/api";

const API_BASE = apiUrl("").replace(/\/$/, "");

/**
 * Fetch business locations as GeoJSON for map display.
 */
export async function getBusinessesGeoJSON(
  filters?: BusinessMapFilters
): Promise<BusinessesGeoJSON> {
  const params = new URLSearchParams();

  if (filters?.city) {
    params.append("city", filters.city);
  }

  if (filters?.business_type) {
    for (const bt of filters.business_type) {
      params.append("business_type", bt);
    }
  }

  if (filters?.naics_code) {
    for (const nc of filters.naics_code) {
      params.append("naics_code", nc);
    }
  }

  const qs = params.toString();
  const url = `${API_BASE}/businesses/map${qs ? `?${qs}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch businesses GeoJSON: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch distinct business types with counts (for filter dropdown).
 */
export async function getBusinessTypes(
  city?: string
): Promise<BusinessTypesResponse> {
  const params = new URLSearchParams();
  if (city) {
    params.append("city", city);
  }

  const qs = params.toString();
  const url = `${API_BASE}/businesses/types${qs ? `?${qs}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch business types: ${response.statusText}`);
  }

  return response.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/businessService.ts
git commit -m "feat: add business API service client"
```

---

## Chunk 2: Mapbox Config (Source + Layer)

### Task 3: Add business source and endpoint

**Files:**
- Modify: `src/config/mapbox/sources.ts`

- [ ] **Step 1: Add the businesses endpoint and source**

Add to the `endpoints` object (after line 11):
```typescript
  // Business locations (heatmap + points)
  businesses: apiUrl("/businesses/map"),
```

Add to the `sources` object (after the `communityResources` entry, before the closing `satisfies`):
```typescript
  businesses: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
    promoteId: "id",
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/config/mapbox/sources.ts
git commit -m "feat: add businesses Mapbox source config"
```

---

### Task 4: Add business circle layer

**Files:**
- Modify: `src/config/mapbox/layers.ts`

- [ ] **Step 1: Add the businessCircles layer definition**

Add after the `communityResourcesCircles` entry (after line 160):
```typescript

  // Business locations layer
  businessCircles: {
    id: "business-circles",
    type: "circle",
    source: "businesses",
    layout: {
      visibility: "none",
    },
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0, 2,
        10, 3,
        14, 6,
        18, 10,
      ],
      "circle-color": "#f59e0b",   // Amber
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1,
      "circle-opacity": 0.75,
    },
  } satisfies CircleLayerSpecification,
```

- [ ] **Step 2: Commit**

```bash
git add src/config/mapbox/layers.ts
git commit -m "feat: add businesses Mapbox layer config"
```

---

## Chunk 3: Map Utilities (Fetch, Events, Popup)

### Task 5: Wire business data into map setup and events

**Files:**
- Modify: `src/utils/map/mapbox.ts`

- [ ] **Step 1: Add import for business service**

Add at the top imports (after the communityResources import, line 9):
```typescript
import { getBusinessesGeoJSON } from "../../services/businessService";
import type { BusinessProperties } from "../../types/business";
```

- [ ] **Step 2: Fetch business data in `setupMapSources`**

In the `setupMapSources` function, after the community resources try/catch block (after line 97), add:

```typescript
    // Business locations are optional; fall back to empty on failure
    let businessesData: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };

    try {
      const fetchedBusinesses = await getBusinessesGeoJSON();
      businessesData = {
        type: fetchedBusinesses.type,
        features: fetchedBusinesses.features,
      };
    } catch (businessError) {
      console.warn("Business data unavailable:", businessError);
    }
```

Then add the source data update (after the communityResources setData call, after line 110):
```typescript
    (map.getSource("businesses") as mapboxgl.GeoJSONSource)?.setData(
      businessesData
    );
```

Update the return statement (line 112) to include `businessesData`:
```typescript
    return { shootingData, censusData, resourcesData, businessesData };
```

- [ ] **Step 3: Add `businessCircles` to `setupMapLayers` layer order**

In `setupMapLayers`, add `"businessCircles"` to the `layerOrder` array (after `"communityResourcesCircles"`):

```typescript
    const layerOrder: LayerKey[] = [
      "heatmap",
      "points",
      "censusOutline",
      "censusFill",
      "communityResourcesCircles",
      "businessCircles",
    ];
```

- [ ] **Step 4: Add `updateBusinessData` export**

After the `updateCommunityResourcesData` function (after line 304), add:

```typescript
export const updateBusinessData = (
  map: mapboxgl.Map,
  data: GeoJSON.FeatureCollection
) => {
  const source = map.getSource("businesses") as mapboxgl.GeoJSONSource;
  if (source) {
    source.setData(data);
  }
};
```

- [ ] **Step 5: Add business click and hover events in `setupMapEvents`**

After the community resources hover events (after line 283), add:

```typescript
  // Business click event
  map.on("click", "business-circles", (e) => {
    if (!e.features?.length) return;

    const feature = e.features[0] as GeoJSONFeature;
    const properties = feature.properties as unknown as BusinessProperties;
    const coordinates = (feature.geometry as GeoJSON.Point).coordinates;

    if (!coordinates) return;

    new mapboxgl.Popup({ className: "business-popup text-black" })
      .setLngLat([coordinates[0], coordinates[1]])
      .setHTML(createBusinessPopupContent(properties))
      .addTo(map);
  });

  // Business hover events
  map.on("mouseenter", "business-circles", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "business-circles", () => {
    map.getCanvas().style.cursor = "";
  });
```

- [ ] **Step 6: Add `createBusinessPopupContent` helper**

At the end of the file, add:

```typescript
const createBusinessPopupContent = (properties: BusinessProperties): string => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.12);
                overflow: hidden;
                width: 260px;
                padding: 0;
                margin: 0;">
      <div style="background: #f59e0b;
                  color: white;
                  padding: 12px 16px;
                  font-size: 14px;
                  font-weight: 600;
                  border-bottom: 1px solid rgba(0,0,0,0.1);">
        ${properties.company || "Unknown Business"}
      </div>
      <div style="padding: 16px;">
        <div style="display: inline-block;
                    background: #f59e0b20;
                    color: #b45309;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 12px;">
          ${properties.business_type || "Business"}
        </div>

        <div style="font-size: 13px; color: #444; margin-bottom: 8px;">
          ${properties.address || "Address unknown"}
        </div>

        ${properties.naics_description
          ? `<div style="font-size: 12px; color: #888; margin-bottom: 4px;">
              NAICS: ${properties.naics_description}
            </div>`
          : ""
        }
      </div>
    </div>
  `;
};
```

- [ ] **Step 7: Commit**

```bash
git add src/utils/map/mapbox.ts
git commit -m "feat: wire business data into map sources, layers, and events"
```

---

## Chunk 4: React Integration (Hook + UI)

### Task 6: Add business layer state to useMapbox hook

**Files:**
- Modify: `src/hooks/useMapbox.tsx`

- [ ] **Step 1: Add imports**

Add at the top (after line 10):
```typescript
import { updateBusinessData } from "../utils/map/mapUpdates";
```

Wait — `updateBusinessData` is in `mapbox.ts`, not `mapUpdates.ts`. Add to the existing import from `../utils/map/mapbox` (line 10):
```typescript
import {
  initializeMap,
  setupMapSources,
  setupMapLayers,
  setupMapEvents,
  updateCommunityResourcesData,
  updateBusinessData,
  setBoundaryLayerVisibility,
  type BoundaryVisibilityConfig,
} from "../utils/map/mapbox";
```

- [ ] **Step 2: Add business state variables**

After the `resourceFilter` state (line 42), add:
```typescript
  const [businessLayerVisible, setBusinessLayerVisibleState] = useState(false);
  const [businessFilter, setBusinessFilterState] = useState<string>("all");
  const businessDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
```

- [ ] **Step 3: Add business visibility toggle and filter functions**

After the `changeResourceFilter` callback (after line 96), add:

```typescript
  const setBusinessLayerVisibility = useCallback((visible: boolean) => {
    setBusinessLayerVisibleState(visible);
  }, []);

  const applyBusinessFilter = useCallback(
    (
      dataset?: GeoJSON.FeatureCollection | null,
      filterOverride?: string
    ) => {
      if (!mapInstanceRef.current) return;
      const baseData = dataset ?? businessDataRef.current;
      if (!baseData) return;

      const activeFilter = filterOverride ?? businessFilter;

      const filteredFeatures =
        activeFilter === "all"
          ? baseData.features
          : baseData.features.filter((feature) => {
              const bt = (feature.properties as { business_type?: string })
                ?.business_type;
              return bt === activeFilter;
            });

      updateBusinessData(mapInstanceRef.current, {
        type: baseData.type,
        features: filteredFeatures,
      });
    },
    [businessFilter]
  );

  const changeBusinessFilter = useCallback(
    (filter: string) => {
      setBusinessFilterState(filter);
      applyBusinessFilter(businessDataRef.current, filter);
    },
    [applyBusinessFilter]
  );
```

- [ ] **Step 4: Store business data from setupMapSources**

In the map initialization effect, after `resourcesDataRef.current = resourcesData;` (line 173), add:
```typescript
            businessDataRef.current = result.businessesData;
```

And after `applyResourceFilter(resourcesData);` (line 175), add:
```typescript
            applyBusinessFilter(result.businessesData);
```

Note: update the destructuring to capture `businessesData`:
```typescript
            const result = await setupMapSources(mapInstanceRef.current);
            const { resourcesData } = result;
            resourcesDataRef.current = resourcesData;
            businessDataRef.current = result.businessesData;
```

Wait — the current code doesn't destructure into a `result` variable. It destructures directly:
```typescript
const { resourcesData } = await setupMapSources(mapInstanceRef.current);
```
Change this to:
```typescript
const { resourcesData, businessesData } = await setupMapSources(mapInstanceRef.current);
```
Then after `resourcesDataRef.current = resourcesData;`:
```typescript
            businessDataRef.current = businessesData;
```
And after `applyResourceFilter(resourcesData);`:
```typescript
            applyBusinessFilter(businessesData);
```

- [ ] **Step 5: Add business visibility effect**

After the community resources visibility effect (after line 227), add:

```typescript
  // Update business layer visibility
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      const map = mapInstanceRef.current;
      const visibility = businessLayerVisible ? "visible" : "none";
      map.setLayoutProperty("business-circles", "visibility", visibility);
    }
  }, [businessLayerVisible, isLoaded]);

  // Apply business type filtering when filter changes
  useEffect(() => {
    if (!isLoaded) return;
    applyBusinessFilter(undefined, businessFilter);
  }, [applyBusinessFilter, businessFilter, isLoaded]);
```

- [ ] **Step 6: Add business state to the return object**

Add to the return object (after `updateShootingData`):
```typescript
    businessLayerVisible,
    setBusinessLayerVisibility,
    businessFilter,
    setBusinessFilter: changeBusinessFilter,
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useMapbox.tsx
git commit -m "feat: add business layer state and filtering to useMapbox hook"
```

---

### Task 7: Add Businesses toggle to MapControlPanel

**Files:**
- Modify: `src/components/map/MapControlPanel.tsx`

- [ ] **Step 1: Extend the props interface**

Add business props to `MapControlPanelProps` (after `onResourceFilterChange`, line 14):
```typescript
  businessLayerVisible: boolean;
  onToggleBusinesses: () => void;
  businessFilter: string;
  onBusinessFilterChange: (filter: string) => void;
  businessTypes: { business_type: string; count: number }[];
```

- [ ] **Step 2: Destructure the new props**

Add to the destructuring (after `city`):
```typescript
  businessLayerVisible,
  onToggleBusinesses,
  businessFilter,
  onBusinessFilterChange,
  businessTypes,
```

- [ ] **Step 3: Add the Businesses toggle button and filter dropdown**

After the Resources filter `<select>` closing `)}` (after line 106), add:

```tsx
        <ToggleButton
          label="Businesses"
          active={businessLayerVisible}
          onClick={onToggleBusinesses}
        />

        {businessLayerVisible && businessTypes.length > 0 && (
          <select
            value={businessFilter}
            onChange={(event) =>
              onBusinessFilterChange(event.target.value)
            }
            className="rounded-full border border-[var(--chat-border)] bg-[var(--apple-notion-pill)] px-2.5 py-1.5 text-xs text-[var(--chat-title)] outline-none"
            aria-label="Business type filter"
          >
            <option value="all">All types</option>
            {businessTypes.map((bt) => (
              <option key={bt.business_type} value={bt.business_type}>
                {bt.business_type} ({bt.count.toLocaleString()})
              </option>
            ))}
          </select>
        )}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/map/MapControlPanel.tsx
git commit -m "feat: add Businesses toggle and type filter to MapControlPanel"
```

---

### Task 8: Pass business props through Toolbar

**Files:**
- Modify: `src/components/toolbar/Toolbar.tsx`

- [ ] **Step 1: Add business props to ToolbarProps interface**

After `onResourceFilterChange` (line 33):
```typescript
  businessLayerVisible: boolean;
  onToggleBusinesses: () => void;
  businessFilter: string;
  onBusinessFilterChange: (filter: string) => void;
  businessTypes: { business_type: string; count: number }[];
```

- [ ] **Step 2: Destructure the new props**

Add to the destructuring (after `onResourceFilterChange`):
```typescript
  businessLayerVisible,
  onToggleBusinesses,
  businessFilter,
  onBusinessFilterChange,
  businessTypes,
```

- [ ] **Step 3: Pass the props to MapControlPanel**

Add to the `<MapControlPanel>` JSX (after `city={city}`, line 229):
```tsx
                businessLayerVisible={businessLayerVisible}
                onToggleBusinesses={onToggleBusinesses}
                businessFilter={businessFilter}
                onBusinessFilterChange={onBusinessFilterChange}
                businessTypes={businessTypes}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/toolbar/Toolbar.tsx
git commit -m "feat: pass business layer props through Toolbar"
```

---

### Task 9: Wire everything in ChatMapApp

**Files:**
- Modify: `src/components/core/ChatMapApp.tsx`

- [ ] **Step 1: Add imports and state for business types**

Add import (after the communityResources import, line 18):
```typescript
import { getBusinessTypes } from "../../services/businessService";
import type { BusinessTypeInfo } from "../../types/business";
```

- [ ] **Step 2: Add business types state**

After the `resourceLoading` state (line 137), add:
```typescript
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeInfo[]>([]);
```

- [ ] **Step 3: Destructure business state from useMapbox**

Add to the useMapbox destructuring (after `updateShootingData`):
```typescript
    businessLayerVisible,
    setBusinessLayerVisibility,
    businessFilter,
    setBusinessFilter,
```

- [ ] **Step 4: Fetch business types on mount**

After the resource details fetch effect (after line 421), add:

```typescript
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await getBusinessTypes(filtersValue.city);
        setBusinessTypes(response.types);
      } catch (e) {
        console.warn("Failed to load business types", e);
      }
    };
    fetchTypes();
  }, [filtersValue.city]);
```

- [ ] **Step 5: Pass business props to Toolbar**

Add to the `<Toolbar>` JSX (after `onResourceFilterChange={setResourceFilter}`):
```tsx
              businessLayerVisible={businessLayerVisible}
              onToggleBusinesses={() =>
                setBusinessLayerVisibility(!businessLayerVisible)
              }
              businessFilter={businessFilter}
              onBusinessFilterChange={setBusinessFilter}
              businessTypes={businessTypes}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/core/ChatMapApp.tsx
git commit -m "feat: wire business layer into ChatMapApp"
```

---

## Chunk 5: Verification

### Task 10: Build and verify

- [ ] **Step 1: Run type check**

```bash
pnpm tsc --noEmit
```
Expected: no type errors

- [ ] **Step 2: Run build**

```bash
pnpm build
```
Expected: successful build

- [ ] **Step 3: Manual verification checklist**

Run `pnpm dev` and verify:
1. Tools panel shows "Businesses" toggle pill after "Resources"
2. Clicking "Businesses" shows amber dots on the map
3. When active, a type filter dropdown appears with business types from the API
4. Selecting a type filters the points on the map
5. Clicking a business dot shows a popup with company name, type, address, NAICS
6. Toggling off hides the layer

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: add business layer with heatmap and type filtering"
```
