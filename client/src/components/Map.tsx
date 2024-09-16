import { useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { selectedCensusBlocks } from "../stores/censusStore";
import ShowChartsButton from "./charts/ShowChartsButton";
import useMapbox from "../hooks/useMapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import useExpandMap from "../hooks/useExpandMap";
import ExpandIcon from "../../public/icons/arrow-expand.svg";
import ShrinkIcon from "../../public/icons/arrow-shrink.svg";

const Map = (): JSX.Element => {
  const censusBlocks = useStore(selectedCensusBlocks);
  const { mapContainer, map, isLoaded } = useMapbox({
    center: [-75.16, 39.96],
    zoom: 11,
  });
  const { isExpanded, toggleExpand } = useExpandMap();
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoaded && map) {
      // Add your map logic here
    }
  }, [isLoaded, map]);

  useEffect(() => {
    if (map) {
      // Clear any existing resize timer
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }

      // Set a new resize timer
      resizeTimerRef.current = setTimeout(() => {
        map.resize();
      }, 10); // 10ms delay to ensure the container has finished transitioning

      // Cleanup function
      return () => {
        if (resizeTimerRef.current) {
          clearTimeout(resizeTimerRef.current);
        }
      };
    }
  }, [isExpanded, map]); // Re-run this effect when isExpanded or map changes

  return (
    <div
      className={`${isExpanded ? "fixed inset-0 z-50 bg-white" : "flex flex-col items-center justify-center"}`}
    >
      {!isExpanded && (
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded mb-2"
          onClick={() => selectedCensusBlocks.set([])}
        >
          Clear Selection
        </button>
      )}
      <div
        ref={mapContainer}
        className={`relative rounded overflow-hidden ${isExpanded ? "w-full h-full" : "sm:w-[80vw] 2xl:w-[60vw] h-[60vh]"}`}
      >
        <button className="absolute z-50 top-2 right-2" onClick={toggleExpand}>
          <img
            src={isExpanded ? ShrinkIcon.src : ExpandIcon.src}
            alt={isExpanded ? "Shrink map" : "Expand map"}
          />
        </button>
      </div>
      {!isExpanded && <ShowChartsButton censusBlock={censusBlocks} />}
    </div>
  );
};

export default Map;
