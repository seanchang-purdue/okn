import { useState, useEffect, useRef } from "react";
import type { Map as MapboxMap } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "../../styles/map.css";
import MapLoader from "../loaders/MapLoader";

interface MapProps {
  mapContainer: React.RefObject<HTMLDivElement>;
  map: MapboxMap | null;
  isLoaded: boolean;
  isExpanded: boolean;
  censusLayersVisible: boolean;
  onShowCensusData?: (geoid: string) => void;
  mapLoading: boolean;
  mapStatusMessage?: string;
}

const Map = ({
  mapContainer,
  map,
  isLoaded,
  isExpanded,
  censusLayersVisible,
  onShowCensusData,
  mapLoading,
  mapStatusMessage,
}: MapProps) => {
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    geoid: string | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    geoid: null,
  });

  useEffect(() => {
    if (isLoaded && map) {
      // Add your map logic here
    }
  }, [isLoaded, map]);

  useEffect(() => {
    if (map) {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }

      resizeTimerRef.current = setTimeout(() => {
        map.resize();
      }, 10) as NodeJS.Timeout;

      return () => {
        if (resizeTimerRef.current) {
          clearTimeout(resizeTimerRef.current);
        }
      };
    }
  }, [isExpanded, map]);

  // Census visibility is now handled in useMapbox hook
  // Removed duplicate visibility management to avoid conflicts

  useEffect(() => {
    if (map && isLoaded) {
      // Add context menu event
      map.on("contextmenu", "census-blocks-fill", (e) => {
        e.preventDefault();

        if (!e.features?.length) return;

        const geoid = e.features[0].properties?.geoid || null;
        if (geoid) {
          setContextMenu({
            visible: true,
            x: e.point.x,
            y: e.point.y,
            geoid,
          });
        }
      });

      // Close context menu on map click
      map.on("click", () => {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      });

      // Close context menu when clicking escape
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setContextMenu((prev) => ({ ...prev, visible: false }));
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isLoaded, map]);

  const handleShowCensusData = () => {
    if (contextMenu.geoid && onShowCensusData) {
      onShowCensusData(contextMenu.geoid);
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        className={`w-full h-full transition-all duration-300 ${
          mapLoading ? "filter blur-sm" : ""
        }`}
      />

      {/* Add the MapLoader component */}
      <MapLoader isLoading={mapLoading} message={mapStatusMessage} />

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="absolute bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-100"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            minWidth: "220px",
            transform: "translateY(-4px)",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          <div className="py-1.5">
            <button
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-150 flex items-center group"
              onClick={handleShowCensusData}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-3 group-hover:bg-blue-200 transition-colors duration-150">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </span>
              <div>
                <div className="font-medium">View Census Data</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Explore demographic information
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
