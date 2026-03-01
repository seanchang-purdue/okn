// src/components/core/ChatMapApp.tsx
import { useState, useMemo, useRef, useEffect } from "react";
import type { Map as MapboxMap, FilterSpecification } from "mapbox-gl";
import ChatBox from "../chat/ChatBox";
import useMapbox from "../../hooks/useMapbox";
import { wsState } from "../../stores/websocketStore";
import Map from "../charts/Map";
import { useStore } from "@nanostores/react";
import { selectedCensusBlocks } from "../../stores/censusStore";
import useChat from "../../hooks/useChat";
import { filtersStore, dateRangeStore } from "../../stores/filterStore";
import { parseDate } from "@internationalized/date";
import type { FilterState } from "../../types/filters";
import TractInsightModal from "../drawers/TractInsightModal";
import CommunityResourcesModal from "../drawers/CommunityResourcesModal";
import { AnimatePresence } from "framer-motion";
import { getCensusTractSummary } from "../../services/demographics";
import { getResourceDetails } from "../../services/communityResources";
import type { CensusTractDemographic } from "../../types/demographic";
import type { ResourceDetails } from "../../types/communityResources";
import {
  chatLayoutActions,
  chatModeStore,
  sidebarWidthStore,
} from "../../stores/chatLayoutStore";
import FloatingChatWindow from "../chat/FloatingChatWindow";
import ChatSidePanel from "../chat/ChatSidePanel";
import useFilterParams from "../../hooks/useFilterParams";
import useGeographySearch, { type GeographyResult } from "../../hooks/useGeographySearch";
import {
  filterGeoJSONByTaxonomy,
  getTaxonomyCounts,
} from "../../utils/map/taxonomy";
import Toolbar from "../toolbar/Toolbar";
import { mapActionActions } from "../../stores/mapActionStore";
import { DEFAULT_CITY } from "../../config/cities";
import type { MapActionBlockData } from "../../types/insight";

const normalizeTaxonomySelection = (input: unknown): string[] => {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0)
    )
  ).sort();
};

const HIGHLIGHT_FILL_LAYER_ID = "map-action-highlight-fill";
const HIGHLIGHT_LINE_LAYER_ID = "map-action-highlight-line";

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
};

const toCenter = (value: unknown): [number, number] | null => {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lng = toNumber(value[0]);
  const lat = toNumber(value[1]);
  if (lng === null || lat === null) return null;
  return [lng, lat];
};

const ensureMapActionHighlightLayers = (map: MapboxMap) => {
  if (!map.getLayer(HIGHLIGHT_FILL_LAYER_ID)) {
    map.addLayer({
      id: HIGHLIGHT_FILL_LAYER_ID,
      type: "fill",
      source: "censusBlocks",
      paint: {
        "fill-color": "rgba(255, 159, 67, 0.3)",
        "fill-outline-color": "rgba(255, 159, 67, 0.95)",
      },
      filter: ["==", ["get", "geoid"], ""],
    });
  }

  if (!map.getLayer(HIGHLIGHT_LINE_LAYER_ID)) {
    map.addLayer({
      id: HIGHLIGHT_LINE_LAYER_ID,
      type: "line",
      source: "censusBlocks",
      paint: {
        "line-color": "rgba(255, 127, 17, 0.95)",
        "line-width": 2,
      },
      filter: ["==", ["get", "geoid"], ""],
    });
  }
};

const ChatMapApp = () => {
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [filterTrigger, setFilterTrigger] = useState(0);
  const [, setShowQuestions] = useState(true);
  const chatResetRef = useRef<(() => void) | null>(null);
  const censusBlocks = useStore(selectedCensusBlocks);
  const chatMode = useStore(chatModeStore);
  const sidebarWidth = useStore(sidebarWidthStore);
  const { isEmbedMode, isHydrated } = useFilterParams();

  const { updateFilters } = useChat();
  const filtersValue = useStore(filtersStore);
  const dateRangeValue = useStore(dateRangeStore);

  const [selectedGeoid, setSelectedGeoid] = useState<string | null>(null);
  const [insightOpen, setInsightOpen] = useState(false);
  const [tractData, setTractData] = useState<CensusTractDemographic | null>(
    null
  );
  const [insightLoading, setInsightLoading] = useState(false);

  const [resourceOpen, setResourceOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [resourceData, setResourceData] = useState<ResourceDetails | null>(null);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [selectedGeography, setSelectedGeography] = useState<{
    label: string;
    type: string;
  } | null>(null);

  const {
    query: geographyQuery,
    setQuery: setGeographyQuery,
    results: geographyResults,
    loading: geographyLoading,
    error: geographyError,
    clear: clearGeographySearch,
  } = useGeographySearch();

  const handleApplyFilters = () => {
    const filterState: FilterState = {
      ...filtersValue,
      dateRange: dateRangeValue
        ? [
            new Date(dateRangeValue.start.toString()),
            new Date(dateRangeValue.end.toString()),
          ]
        : undefined,
    };
    updateFilters(filterState);
    setFilterTrigger((prev) => prev + 1);
  };

  const handleShowCensusData = (geoid: string) => {
    setSelectedGeoid(geoid);
    setInsightOpen(true);
  };

  const handleShowResourceData = (resourceId: number) => {
    setSelectedResourceId(resourceId);
    setResourceOpen(true);
  };

  const {
    mapContainer,
    map,
    isLoaded,
    toggleCensusLayers,
    censusLayersVisible,
    resourcesLayerVisible,
    setResourcesLayerVisibility,
    resourceFilter,
    setResourceFilter,
    toggleHeatmapLayer,
    heatmapVisible,
    updateShootingData,
  } = useMapbox({
    center: DEFAULT_CITY.center,
    zoom: DEFAULT_CITY.zoom,
    onShowCensusData: handleShowCensusData,
    onShowResourceData: handleShowResourceData,
  });
  const websocketState = useStore(wsState);
  const selectedTaxonomy = useMemo(
    () => normalizeTaxonomySelection(filtersValue.incidentTaxonomy),
    [filtersValue.incidentTaxonomy]
  );
  const filteredGeoJSON = useMemo(
    () => filterGeoJSONByTaxonomy(websocketState.geoJSONData, selectedTaxonomy),
    [websocketState.geoJSONData, selectedTaxonomy]
  );
  const taxonomyCounts = useMemo(
    () => getTaxonomyCounts(websocketState.geoJSONData),
    [websocketState.geoJSONData]
  );

  const applyGeographySelection = (result: GeographyResult) => {
    setSelectedGeography({
      label: result.fullName,
      type: result.primaryType,
    });

    filtersStore.set({
      ...filtersStore.get(),
      geography: result.fullName,
      geographyType: result.primaryType,
      city: result.primaryType === "place" ? result.label : undefined,
    });

    if (!map) return;

    if (result.bbox && result.bbox.length === 4) {
      map.fitBounds(
        [
          [result.bbox[0], result.bbox[1]],
          [result.bbox[2], result.bbox[3]],
        ],
        { padding: 40, duration: 1000 }
      );
      return;
    }

    map.flyTo({
      center: result.center,
      zoom: result.primaryType === "address" || result.primaryType === "poi" ? 14 : 11,
      duration: 1000,
    });
  };

  const clearGeographySelection = () => {
    setSelectedGeography(null);
    clearGeographySearch();

    const nextFilters = { ...filtersStore.get() };
    delete nextFilters.geography;
    delete nextFilters.geographyType;
    delete nextFilters.city;
    filtersStore.set(nextFilters);
  };

  const handleTaxonomyChange = (next: string[]) => {
    const normalized = normalizeTaxonomySelection(next);
    const currentFilters = { ...filtersStore.get() };
    if (normalized.length > 0) {
      currentFilters.incidentTaxonomy = normalized;
    } else {
      delete currentFilters.incidentTaxonomy;
    }
    filtersStore.set(currentFilters);
  };

  useEffect(() => {
    if (!map || !isLoaded) {
      mapActionActions.clearExecutor();
      return;
    }

    mapActionActions.registerExecutor((action: MapActionBlockData) => {
      try {
        if (action.action === "flyTo") {
          const center = toCenter(action.params.center);
          const zoom = toNumber(action.params.zoom) ?? map.getZoom();
          if (!center) return;
          map.flyTo({
            center,
            zoom,
            duration: 900,
          });
          return;
        }

        if (action.action === "highlight") {
          ensureMapActionHighlightLayers(map);
          const geoids = toStringList(action.params.geoids);
          if (geoids.length === 0) return;
          const filterExpression: FilterSpecification = [
            "in",
            ["get", "geoid"],
            ["literal", geoids],
          ];

          if (map.getLayer(HIGHLIGHT_FILL_LAYER_ID)) {
            map.setFilter(HIGHLIGHT_FILL_LAYER_ID, filterExpression);
          }
          if (map.getLayer(HIGHLIGHT_LINE_LAYER_ID)) {
            map.setFilter(HIGHLIGHT_LINE_LAYER_ID, filterExpression);
          }
          return;
        }

        if (action.action === "filter") {
          const reset = action.params.reset === true;
          if (reset) {
            if (map.getLayer("shooting-point")) map.setFilter("shooting-point", null);
            if (map.getLayer("shooting-heat")) map.setFilter("shooting-heat", null);
            return;
          }

          const providedExpression = action.params
            .expression as FilterSpecification | undefined;
          let filterExpression: FilterSpecification | null = null;

          if (Array.isArray(providedExpression)) {
            filterExpression = providedExpression;
          } else {
            const field = String(action.params.field ?? "").trim();
            const values = toStringList(action.params.values);
            const operator = String(action.params.operator ?? "in");

            if (!field) return;

            if (operator === "==" && values.length > 0) {
              filterExpression = ["==", ["get", field], values[0]];
            } else if (operator === "!=" && values.length > 0) {
              filterExpression = ["!=", ["get", field], values[0]];
            } else if (values.length > 0) {
              filterExpression = ["in", ["get", field], ["literal", values]];
            }
          }

          if (!filterExpression) return;
          if (map.getLayer("shooting-point")) {
            map.setFilter("shooting-point", filterExpression);
          }
          if (map.getLayer("shooting-heat")) {
            map.setFilter("shooting-heat", filterExpression);
          }
          return;
        }

        if (action.action === "toggleLayer") {
          const layerId = String(action.params.layerId ?? "").trim();
          const visible = action.params.visible !== false;
          if (!layerId || !map.getLayer(layerId)) return;
          map.setLayoutProperty(
            layerId,
            "visibility",
            visible ? "visible" : "none"
          );
        }
      } catch (error) {
        console.error("Failed to execute map action block", error);
      }
    });

    return () => {
      mapActionActions.clearExecutor();
    };
  }, [isLoaded, map]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncMode = () => chatLayoutActions.syncViewportMode(mediaQuery.matches);
    syncMode();
    mediaQuery.addEventListener("change", syncMode);
    return () => mediaQuery.removeEventListener("change", syncMode);
  }, []);

  useEffect(() => {
    if (!isHydrated || dateRangeValue) return;
    const today = new Date();
    const threeYearsAgo = new Date(today);
    threeYearsAgo.setFullYear(today.getFullYear() - 3);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    dateRangeStore.set({
      start: parseDate(fmt(threeYearsAgo)),
      end: parseDate(fmt(today)),
    });
  }, [dateRangeValue, isHydrated]);

  useEffect(() => {
    if (isLoaded && filteredGeoJSON) {
      updateShootingData(filteredGeoJSON);
    }
  }, [isLoaded, filteredGeoJSON, updateShootingData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!insightOpen || !selectedGeoid) return;
      try {
        setInsightLoading(true);
        const data = await getCensusTractSummary(selectedGeoid);
        setTractData(data);
      } catch (e) {
        console.error("Failed to load tract data", e);
        setTractData(null);
      } finally {
        setInsightLoading(false);
      }
    };
    fetchData();
  }, [insightOpen, selectedGeoid]);

  useEffect(() => {
    const fetchData = async () => {
      if (!resourceOpen || !selectedResourceId) return;
      try {
        setResourceLoading(true);
        const data = await getResourceDetails(selectedResourceId);
        setResourceData(data);
      } catch (e) {
        console.error("Failed to load resource data", e);
        setResourceData(null);
      } finally {
        setResourceLoading(false);
      }
    };
    fetchData();
  }, [resourceOpen, selectedResourceId]);

  useEffect(() => {
    if (typeof filtersValue.geography === "string" && filtersValue.geography) {
      setSelectedGeography({
        label: filtersValue.geography,
        type:
          typeof filtersValue.geographyType === "string"
            ? filtersValue.geographyType
            : "location",
      });
      return;
    }
    setSelectedGeography(null);
  }, [filtersValue.geography, filtersValue.geographyType]);

  return (
    <>
      {/* Map container — always full-screen, shrinks when panel open */}
      <div
        className="h-full w-full transition-all duration-300"
        style={{
          paddingRight:
            chatMode === "sidebar" && !isEmbedMode ? `${sidebarWidth}px` : undefined,
        }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-2xl">
          <Map
            mapContainer={mapContainer}
            map={map}
            isLoaded={isLoaded}
            chatMode={chatMode}
            censusLayersVisible={censusLayersVisible}
            onShowCensusData={handleShowCensusData}
            mapLoading={websocketState.mapLoading}
            mapStatusMessage={websocketState.mapStatusMessage}
          />

          {!isEmbedMode && (
            <Toolbar
              query={geographyQuery}
              onQueryChange={setGeographyQuery}
              results={geographyResults}
              loading={geographyLoading}
              error={geographyError}
              onSelect={applyGeographySelection}
              onClearSearch={clearGeographySearch}
              selectedGeography={selectedGeography}
              onClearSelection={clearGeographySelection}
              onApplyFilter={handleApplyFilters}
              selectedTaxonomy={selectedTaxonomy}
              taxonomyCounts={taxonomyCounts}
              onTaxonomyChange={handleTaxonomyChange}
              heatmapVisible={heatmapVisible}
              onToggleHeatmap={toggleHeatmapLayer}
              censusLayersVisible={censusLayersVisible}
              onToggleCensusLayers={toggleCensusLayers}
              censusBlocks={censusBlocks}
              onClearCensus={() => selectedCensusBlocks.set([])}
              resourcesLayerVisible={resourcesLayerVisible}
              onToggleResources={() =>
                setResourcesLayerVisibility(!resourcesLayerVisible)
              }
              resourceFilter={resourceFilter}
              onResourceFilterChange={setResourceFilter}
              city={filtersValue.city}
              chartTrigger={filterTrigger}
            />
          )}
        </div>
      </div>

      {/* Chat interfaces */}
      {!isEmbedMode && (
        <AnimatePresence mode="wait" initial={false}>
          {chatMode === "floating" && (
            <FloatingChatWindow key="floating">
              <ChatBox
                selectedQuestion={selectedQuestion}
                onQuestionSent={() => setSelectedQuestion("")}
                setShowQuestions={setShowQuestions}
                onResetChat={(resetFn) => {
                  chatResetRef.current = resetFn;
                }}
              />
            </FloatingChatWindow>
          )}
          {chatMode !== "floating" && (
            <ChatSidePanel key={chatMode}>
              <ChatBox
                selectedQuestion={selectedQuestion}
                onQuestionSent={() => setSelectedQuestion("")}
                setShowQuestions={setShowQuestions}
                onResetChat={(resetFn) => {
                  chatResetRef.current = resetFn;
                }}
              />
            </ChatSidePanel>
          )}
        </AnimatePresence>
      )}

      {/* Modals and drawers */}

      <TractInsightModal
        isOpen={insightOpen}
        onOpenChange={setInsightOpen}
        data={tractData}
        loading={insightLoading}
      />

      <CommunityResourcesModal
        isOpen={resourceOpen}
        onOpenChange={setResourceOpen}
        data={resourceData}
        loading={resourceLoading}
      />
    </>
  );
};

export default ChatMapApp;
