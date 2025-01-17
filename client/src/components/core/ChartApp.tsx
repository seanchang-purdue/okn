import { useState } from "react";
import { useStore } from "@nanostores/react";
import { selectedCensusBlocks } from "../../stores/censusStore";
import useExpandMap from "../../hooks/useExpandMap";
import useMapbox from "../../hooks/useMapbox";
import ExpandIcon from "../../icons/arrow-expand.svg";
import ShrinkIcon from "../../icons/arrow-shrink.svg";
import MaterialBorder from "../../icons/material-border.svg";
import MaterialBorderClear from "../../icons/material-border-clear.svg";
import MaterialClear from "../../icons/material-clear.svg";
import MaterialFilter from "../../icons/material-filter.svg";
import OknCharts from "../charts/OknCharts";
import Map from "../charts/Map";
import { Button, Tooltip, useDisclosure } from "@heroui/react";
import MapDataFilter from "../forms/MapDataFileter";

const ChartApp = () => {
  const [filterTrigger, setFilterTrigger] = useState(0);
  const censusBlocks = useStore(selectedCensusBlocks);
  const { isExpanded, toggleExpand } = useExpandMap();
  const {
    mapContainer,
    map,
    isLoaded,
    toggleCensusLayers,
    censusLayersVisible,
  } = useMapbox({
    center: [-75.16, 39.96],
    zoom: 11,
  });

  const applyFilters = () => {
    setFilterTrigger((prev) => prev + 1);
  };

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div
      className={`${isExpanded ? "fixed inset-0 z-50" : "flex flex-col items-center justify-center"}`}
    >
      <div className="flex flex-row justify-center items-start gap-x-4">
        <div
          className={`relative rounded overflow-hidden ${isExpanded ? "w-screen h-screen" : "w-[75vw] 2xl:w-[60vw] h-[60vh] m-8"}`}
        >
          <Map
            mapContainer={mapContainer}
            map={map}
            isLoaded={isLoaded}
            isExpanded={isExpanded}
            censusLayersVisible={censusLayersVisible}
          />
          <div className="absolute z-10 top-2 right-2 flex flex-col">
            <Button isIconOnly onClick={toggleExpand} variant="light">
              <img
                src={isExpanded ? ShrinkIcon.src : ExpandIcon.src}
                alt={isExpanded ? "Shrink map" : "Expand map"}
              />
            </Button>
            <Tooltip
              content="Apply Filters"
              placement={isExpanded ? "left" : "right"}
            >
              <Button
                isIconOnly
                color="primary"
                onClick={onOpen}
                variant="light"
              >
                <img src={MaterialFilter.src} alt="Apply Filters" />
              </Button>
            </Tooltip>
            <Tooltip
              content="Toggle census layers"
              placement={isExpanded ? "left" : "right"}
            >
              <Button
                isIconOnly
                color="primary"
                onClick={toggleCensusLayers}
                variant="light"
              >
                <img
                  src={
                    censusLayersVisible
                      ? MaterialBorderClear.src
                      : MaterialBorder.src
                  }
                  alt={
                    censusLayersVisible
                      ? "Hide census layers"
                      : "Show census layers"
                  }
                />
              </Button>
            </Tooltip>
            {censusBlocks.length > 0 && (
              <Tooltip
                content="Clear selected census blocks"
                placement={isExpanded ? "left" : "right"}
              >
                <Button
                  isIconOnly
                  color="primary"
                  onClick={() => selectedCensusBlocks.set([])}
                  variant="light"
                >
                  <img
                    src={MaterialClear.src}
                    alt="Clear selected census blocks"
                  />
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
      {!isExpanded && (
        <OknCharts censusBlock={censusBlocks} trigger={filterTrigger} />
      )}

      <MapDataFilter
        onApplyFilter={applyFilters}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      />
    </div>
  );
};

export default ChartApp;
