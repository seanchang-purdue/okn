// src/components/core/ChatMapApp.tsx
import { useState, useMemo, useRef, useEffect } from "react";
import ChatBox from "../chat/ChatBox";
import { useDisclosure } from "@heroui/react";
import FilterButton from "../buttons/FilterButton";
import CensusLayerButton from "../buttons/CensusLayerButton";
import ClearCensusButton from "../buttons/ClearCensusButton";
import type { SharedSelection } from "@heroui/react";
import type { ModelType } from "../../config/ws";
import useMapbox from "../../hooks/useMapbox";
import { wsState, wsActions } from "../../stores/websocketStore";
import Map from "../charts/Map";
import { useStore } from "@nanostores/react";
import { selectedCensusBlocks } from "../../stores/censusStore";
import ExpandMapButton from "../buttons/ExpandMapButton";
import MapDataFilter from "../filters/MapDataFilter";
import useChat from "../../hooks/useChat";
import { filtersStore, dateRangeStore } from "../../stores/filterStore";
import { parseDate } from "@internationalized/date";
import type { FilterState } from "../../types/filters";
import GenerateSummaryButton from "../buttons/GenerateSummaryButton";
import ModelDropdown from "../dropdowns/ModelDropdown";
import CitySelectButton from "../buttons/CitySelectButton";
import TractInsightModal from "../drawers/TractInsightModal";
import OknCharts from "../charts/OknCharts";
import useExpandMap from "../../hooks/useExpandMap";
// MapLoader is not used directly here
import { motion } from "framer-motion";
import { getCensusTractSummary } from "../../services/demographics";
import type { CensusTractDemographic } from "../../types/demographic";

// Preset question arrays removed for now (unused)

const ChatMapApp = () => {
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [filterTrigger, setFilterTrigger] = useState(0);
  const [showQuestions, setShowQuestions] = useState(true);
  // const { updateMap } = useStore(wsState); // not used
  const [selectedKeys, setSelectedKeys] = useState<Set<ModelType>>(
    new Set(["CHAT"])
  );
  const chatResetRef = useRef<(() => void) | null>(null);
  const censusBlocks = useStore(selectedCensusBlocks);

  const { isExpanded, toggleExpand } = useExpandMap();

  const { updateFilters } = useChat();
  const filtersValue = useStore(filtersStore);
  const dateRangeValue = useStore(dateRangeStore);
  // Time range defaults managed via MapDataFilter (dateRangeStore)

  const [selectedGeoid, setSelectedGeoid] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  // Tract insight modal state
  const [insightOpen, setInsightOpen] = useState(false);
  const [tractData, setTractData] = useState<CensusTractDemographic | null>(
    null
  );
  const [insightLoading, setInsightLoading] = useState(false);

  const model = useMemo(
    () => Array.from(selectedKeys)[0] as ModelType,
    [selectedKeys]
  );

  // const questions = model === "CHAT" ? regularQuestions : sparqlQuestions; // unused for now

  const handleRefresh = () => {
    setSelectedQuestion("");
    setShowQuestions(true);
    wsActions.resetChat(); // Use the WebSocket store's reset function
    if (chatResetRef.current) {
      chatResetRef.current();
    }
  };

  const handleApplyFilters = () => {
    // Create a FilterState object combining both filter values and date range
    const filterState: FilterState = {
      ...filtersValue,
      dateRange: dateRangeValue
        ? [
            new Date(dateRangeValue.start.toString()),
            new Date(dateRangeValue.end.toString()),
          ]
        : undefined,
    };

    // Update filters through the chat hook
    updateFilters(filterState);
    setFilterTrigger((prev) => prev + 1);
  };

  const handleSelectionChange = (keys: SharedSelection) => {
    const newKey = Array.from(keys)[0] as ModelType;
    setSelectedKeys(new Set([newKey]));
    wsActions.changeEndpoint(newKey); // Change the model
    handleRefresh(); // Reset everything when model changes
  };

  const handleShowCensusData = (geoid: string) => {
    setSelectedGeoid(geoid);
    setInsightOpen(true);
  };

  const {
    mapContainer,
    map,
    isLoaded,
    toggleCensusLayers,
    censusLayersVisible,
    updateShootingData,
  } = useMapbox({
    center: [-75.16, 39.96],
    zoom: 11,
  });
  const websocketState = useStore(wsState);

  // Ensure default date range is last 3 years on first load
  useEffect(() => {
    if (!dateRangeValue) {
      const today = new Date();
      const threeYearsAgo = new Date(today);
      threeYearsAgo.setFullYear(today.getFullYear() - 3);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      dateRangeStore.set({
        start: parseDate(fmt(threeYearsAgo)),
        end: parseDate(fmt(today)),
      });
    }
    // run once
  }, []);

  // Effect to watch for GeoJSON updates from websocket
  useEffect(() => {
    if (isLoaded && websocketState.geoJSONData) {
      updateShootingData(websocketState.geoJSONData);
    }
  }, [isLoaded, websocketState.geoJSONData, updateShootingData]);

  // Fetch tract summary for modal when opened
  useEffect(() => {
    const fetchData = async () => {
      if (!insightOpen || !selectedGeoid) return;
      try {
        setInsightLoading(true);
        const data = await getCensusTractSummary(selectedGeoid);
        setTractData(data);
      } catch (e) {
        // Log but do not store unused error state
        console.error("Failed to load tract data", e);
        setTractData(null);
      } finally {
        setInsightLoading(false);
      }
    };
    fetchData();
  }, [insightOpen, selectedGeoid]);

  return (
    <>
      <div
        className={`${
          isExpanded
            ? "fixed inset-0 z-50 flex items-center justify-center"
            : "flex flex-row items-center justify-center w-full h-full"
        }`}
      >
        {/* Only show chat section when not expanded */}
        {!isExpanded && (
          <div
            className={`flex flex-col items-center w-1/2 h-full p-4 overflow-hidden ${showQuestions ? "justify-center" : "justify-start"}`}
          >
            <div
              className={`w-full max-w-3xl transition-all duration-150 ease-in-out ${showQuestions ? "" : "h-full flex flex-col"}`}
            >
              <ChatBox
                selectedQuestion={selectedQuestion}
                onQuestionSent={() => setSelectedQuestion("")}
                setShowQuestions={setShowQuestions}
                onResetChat={(resetFn) => {
                  chatResetRef.current = resetFn;
                }}
                selectedModel={model}
              />
            </div>
          </div>
        )}

        {/* Model dropdown only when not expanded */}
        {!isExpanded && (
          <div className="absolute top-20 left-4 z-40 w-auto">
            <ModelDropdown
              model={model}
              selectedKeys={selectedKeys}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        )}

        {/* map section - takes full width when expanded */}
        <div
          className={`${
            isExpanded
              ? "w-full h-full"
              : "flex flex-col items-center justify-center w-1/2 h-full p-4"
          } overflow-hidden relative`}
        >
          <div className="relative w-full h-full rounded overflow-hidden">
            <Map
              mapContainer={mapContainer}
              map={map}
              isLoaded={isLoaded}
              isExpanded={isExpanded}
              censusLayersVisible={censusLayersVisible}
              onShowCensusData={handleShowCensusData}
              mapLoading={websocketState.mapLoading}
            />

            {/* functional buttons */}
            <motion.div
              className="absolute z-10 top-2 right-2 flex flex-col gap-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: -8 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { staggerChildren: 0.08, delayChildren: 0.1 },
                },
              }}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: -6 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <CitySelectButton
                  isExpanded={isExpanded}
                  onSelect={(city) => {
                    if (map) {
                      map.flyTo({ center: city.center, zoom: city.zoom ?? 11 });
                    }
                  }}
                />
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: -6 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <ExpandMapButton
                  isExpanded={isExpanded}
                  toggleExpand={toggleExpand}
                />
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: -6 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <FilterButton onOpen={onOpen} isExpanded={isExpanded} />
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: -6 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <CensusLayerButton
                  censusLayersVisible={censusLayersVisible}
                  toggleCensusLayers={toggleCensusLayers}
                  isExpanded={isExpanded}
                />
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: -6 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <ClearCensusButton
                  isExpanded={isExpanded}
                  censusBlocks={censusBlocks}
                />
              </motion.div>
            </motion.div>

            {/* generate summary - only show when not expanded */}
            {!isExpanded && (
              <div className="absolute z-10 bottom-2 left-1/2 transform -translate-x-1/2">
                <GenerateSummaryButton />
              </div>
            )}
          </div>
        </div>

        {/* Charts - only show when not expanded */}
        {!isExpanded && (
          <OknCharts censusBlock={censusBlocks} trigger={filterTrigger} />
        )}
      </div>

      {/* Modals and drawers - always available */}
      <MapDataFilter
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onApplyFilter={handleApplyFilters}
      />

      <TractInsightModal
        isOpen={insightOpen}
        onOpenChange={setInsightOpen}
        data={tractData}
        loading={insightLoading}
      />
    </>
  );
};

export default ChatMapApp;
