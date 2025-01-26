import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapProps {
  mapContainer: React.RefObject<HTMLDivElement>;
  map: mapboxgl.Map | null;
  isLoaded: boolean;
  isExpanded: boolean;
  censusLayersVisible: boolean;
}

const Map = ({
  mapContainer,
  map,
  isLoaded,
  isExpanded,
  censusLayersVisible,
}: MapProps) => {
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (map && isLoaded) {
      const visibility = censusLayersVisible ? "visible" : "none";
      map.setLayoutProperty("census-block-outline", "visibility", visibility);
      map.setLayoutProperty("census-blocks-fill", "visibility", visibility);
    }
  }, [censusLayersVisible, isLoaded, map]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default Map;
