import React from "react";
import { Spinner } from "@heroui/react";

interface MapLoaderProps {
  isLoading: boolean;
}

const MapLoader: React.FC<MapLoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-white/90 dark:bg-gray-800/90 p-2.5 rounded-lg shadow-md flex items-center gap-2.5 border border-blue-200 dark:border-blue-800">
        <Spinner size="sm" color="primary" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Updating map
        </span>
      </div>
    </div>
  );
};

export default MapLoader;
