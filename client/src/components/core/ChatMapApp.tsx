// src/components/core/ChatMapApp.tsx
import { useState, useMemo, useRef, useEffect } from "react";
import ChatBox from "../chat/ChatBox";
import { Card, useDisclosure, Switch } from "@heroui/react";
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
import type { FilterState } from "../../types/filters";
import GenerateSummaryButton from "../buttons/GenerateSummaryButton";
import ModelDropdown from "../dropdowns/ModelDropdown";
import CensusDataDrawer from "../drawers/CensusDataDrawer";
import OknCharts from "../charts/OknCharts";
import useExpandMap from "../../hooks/useExpandMap";
import MapLoader from "../loaders/MapLoader";

const regularQuestions = [
  "How many fatal shootings occurred in 2023?",
  "Show me shootings that happened in July 2023.",
  "How have shootings changed over the past five years?",
];

const sparqlQuestions = [
  `SELECT (COUNT(?obj) as ?count) WHERE { ?obj ?date ?d . ?obj ?is_fatal "Y" . FILTER(?d >= "2023-01-01" && ?d <= "2023-12-31") }`,
  `SELECT ?count WHERE { SELECT (COUNT(?obj) as ?count) WHERE { ?obj ?wound "Stomach" } }`,
  `SELECT ?obj ?date WHERE { ?obj ?date ?d . FILTER(?d >= "2023-07-01" && ?d <= "2023-07-31") }`,
];

const ChatMapApp = () => {
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [filterTrigger, setFilterTrigger] = useState(0);
  const [showQuestions, setShowQuestions] = useState(true);
  const [isChatEmpty, setIsChatEmpty] = useState(true);
  const { updateMap } = useStore(wsState);
  const [selectedKeys, setSelectedKeys] = useState<Set<ModelType>>(
    new Set(["CHAT"])
  );
  const chatResetRef = useRef<(() => void) | null>(null);
  const censusBlocks = useStore(selectedCensusBlocks);

  const { isExpanded, toggleExpand } = useExpandMap();

  const { updateFilters } = useChat();
  const filtersValue = useStore(filtersStore);
  const dateRangeValue = useStore(dateRangeStore);

  // Census data drawer state
  const censusDrawerDisclosure = useDisclosure();
  const [selectedTractId, setSelectedTractId] = useState<number | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const model = useMemo(
    () => Array.from(selectedKeys)[0] as ModelType,
    [selectedKeys]
  );

  const questions = model === "CHAT" ? regularQuestions : sparqlQuestions;

  const getHeaderText = () => {
    if (model === "CHAT") {
      return "Ask me anything about US gun violence. You can try:";
    }
    return "Beta Mode: This version uses knowledge graph data through SPARQL queries. Currently only accepts raw SPARQL queries. Try these examples:";
  };

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question);
  };

  const handleRefresh = () => {
    setSelectedQuestion("");
    setShowQuestions(true);
    setIsChatEmpty(true);
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

  const handleShowCensusData = (tractId: string) => {
    // Convert string tractId to number (adjust based on your data format)
    const numericTractId = parseFloat(tractId);
    setSelectedTractId(numericTractId);
    censusDrawerDisclosure.onOpen();
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

  // Effect to watch for GeoJSON updates from websocket
  useEffect(() => {
    if (isLoaded && websocketState.geoJSONData) {
      updateShootingData(websocketState.geoJSONData);
    }
  }, [isLoaded, websocketState.geoJSONData, updateShootingData]);

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
          <div className="flex flex-col items-center justify-end w-1/2 h-full p-4 overflow-hidden">
            <div className="w-full max-w-3xl mb-4 transition-all duration-150 ease-in-out">
              {showQuestions && (
                <div
                  className="flex flex-col items-center mb-6 transition-opacity duration-150 ease-in-out"
                  style={{
                    opacity: showQuestions ? 1 : 0,
                    transform: showQuestions
                      ? "translateY(0)"
                      : "translateY(-10px)",
                  }}
                >
                  <h2 className="mb-4 text-black dark:text-white text-xl font-medium tracking-tight transition-colors duration-150">
                    {getHeaderText()}
                  </h2>

                  <div className="w-full max-w-2xl backdrop-blur-sm rounded-xl p-4 shadow-sm mb-6 transition-all duration-150">
                    <ul className="flex flex-wrap justify-center gap-2.5">
                      {questions.map((q, i) => (
                        <li
                          key={i}
                          className="transform transition-all hover:scale-105"
                          style={{
                            transitionDelay: `${i * 50}ms`,
                            opacity: showQuestions ? 1 : 0,
                            transform: showQuestions
                              ? "translateY(0)"
                              : "translateY(10px)",
                          }}
                        >
                          <Card
                            onPress={() => handleQuestionClick(q)}
                            className="p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                            isHoverable
                            isPressable
                            radius="lg"
                          >
                            <span className="text-sm font-medium">{q}</span>
                          </Card>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm transition-all duration-150"
                    style={{
                      opacity: showQuestions ? 1 : 0,
                      transform: showQuestions
                        ? "translateY(0)"
                        : "translateY(10px)",
                    }}
                  >
                    <Switch
                      isSelected={updateMap}
                      onValueChange={(value) =>
                        wsActions.toggleMapUpdate(value)
                      }
                      size="sm"
                      color="primary"
                      className="transition-opacity duration-150"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-update map
                    </span>
                  </div>
                </div>
              )}

              <ChatBox
                selectedQuestion={selectedQuestion}
                onQuestionSent={() => setSelectedQuestion("")}
                setShowQuestions={setShowQuestions}
                onChatStateChange={(isEmpty: boolean) =>
                  setIsChatEmpty(isEmpty)
                }
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
            <div className="absolute z-10 top-2 right-2 flex flex-col gap-2">
              <ExpandMapButton
                isExpanded={isExpanded}
                toggleExpand={toggleExpand}
              />

              <FilterButton onOpen={onOpen} isExpanded={isExpanded} />

              <CensusLayerButton
                censusLayersVisible={censusLayersVisible}
                toggleCensusLayers={toggleCensusLayers}
                isExpanded={isExpanded}
              />

              <ClearCensusButton
                isExpanded={isExpanded}
                censusBlocks={censusBlocks}
              />
            </div>

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

      <CensusDataDrawer
        isOpen={censusDrawerDisclosure.isOpen}
        onOpenChange={censusDrawerDisclosure.onOpenChange}
        tractId={selectedTractId}
      />
    </>
  );
};

export default ChatMapApp;
