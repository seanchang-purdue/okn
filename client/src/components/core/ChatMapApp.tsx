// src/components/core/ChatMapApp.tsx
import { useState, useMemo, useRef, useEffect } from "react";
import ChatBox from "../chat/ChatBox";
import { Card, useDisclosure } from "@heroui/react";
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

const regularQuestions = [
  "How many fatal shootings occurred in 2023?",
  "Show me shootings that happened in July 2023.",
  "How have shootings changed over the past five years?",
];

const sparqlQuestions = [
  "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 50",
  "SELECT ?s ?p ?o WHERE { ?s ?p ?o . FILTER(isLiteral(?o)) } LIMIT 50",
  "SELECT ?s ?o WHERE { ?s ?p ?o . FILTER(CONTAINS(STR(?s), 'STATE') || CONTAINS(STR(?o), 'STATE')) } LIMIT 50",
];

const ChatMapApp = () => {
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [filterTrigger, setFilterTrigger] = useState(0);
  const [showQuestions, setShowQuestions] = useState(true);
  const [isChatEmpty, setIsChatEmpty] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<Set<ModelType>>(
    new Set(["CHAT"]),
  );
  const chatResetRef = useRef<(() => void) | null>(null);
  const censusBlocks = useStore(selectedCensusBlocks);

  const { updateFilters } = useChat();
  const filtersValue = useStore(filtersStore);
  const dateRangeValue = useStore(dateRangeStore);

  const model = useMemo(
    () => Array.from(selectedKeys)[0] as ModelType,
    [selectedKeys],
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

  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(!isExpanded);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Effect to watch for GeoJSON updates from websocket
  useEffect(() => {
    if (isLoaded && websocketState.geoJSONData) {
      updateShootingData(websocketState.geoJSONData);
    }
  }, [isLoaded, websocketState.geoJSONData, updateShootingData]);

  return (
    <>
    <div className="absolute top-20 left-4 z-50 w-auto">
    <ModelDropdown
          model={model}
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
        />
  </div>

    <div className="flex flex-row items-center justify-center w-full h-full">
      {/* chat section */}
      <div className="flex flex-col items-center justify-end w-1/2 h-full p-4 overflow-hidden">
        <div className="w-full max-w-3xl mb-4">
          {showQuestions && (
            <div className="flex flex-col items-center mb-4">
              <p className="mb-2 text-black dark:text-white text-lg">
                {getHeaderText()}
              </p>
              <ul className="flex flex-wrap justify-center gap-2">
                {questions.map((q, i) => (
                  <li key={i}>
                    <Card
                      onPress={() => handleQuestionClick(q)}
                      className="p-2"
                      isHoverable
                      isPressable
                      >
                      {q}
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ChatBox
            selectedQuestion={selectedQuestion}
            onQuestionSent={() => setSelectedQuestion("")}
            setShowQuestions={setShowQuestions}
            onChatStateChange={(isEmpty: boolean) => setIsChatEmpty(isEmpty)}
            onResetChat={(resetFn) => {
              chatResetRef.current = resetFn;
            }}
            selectedModel={model}
            />
        </div>
      </div>

      {/* map section */}
      <div className="flex flex-col items-center justify-center w-1/2 h-full p-4 overflow-hidden">
        <div
          className={`relative w-full h-full rounded overflow-hidden ${
            isExpanded ? "fixed inset-0 z-50" : ""
            }`}
            >
          <Map
            mapContainer={mapContainer}
            map={map}
            isLoaded={isLoaded}
            isExpanded={isExpanded}
            censusLayersVisible={censusLayersVisible}
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

          {/* generate summary */}
          <div className="absolute z-10 bottom-2 left-1/2 transform -translate-x-1/2">
            <GenerateSummaryButton />
          </div>
        </div>
      </div>

      <MapDataFilter
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onApplyFilter={handleApplyFilters}
        />
    </div>
        </>
  );
};

export default ChatMapApp;
