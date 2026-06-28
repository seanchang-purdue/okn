import React from "react";
import { Loader2 } from "lucide-react";

interface MapLoaderProps {
  isLoading: boolean;
  message?: string;
}

const MapLoader: React.FC<MapLoaderProps> = ({ isLoading, message }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card/90 px-3 py-2.5 shadow-md backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span className="text-xs font-medium text-foreground">
          {message || "Updating map..."}
        </span>
      </div>
    </div>
  );
};

export default MapLoader;
