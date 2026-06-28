import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResourceFilterOption } from "../buttons/CommunityResourcesLayerButton";
import { isPhiladelphia } from "../../config/cities";

interface MapControlPanelProps {
  heatmapVisible: boolean;
  onToggleHeatmap: () => void;
  censusLayersVisible: boolean;
  onToggleCensusLayers: () => void;
  censusBlocks: string[];
  onClearCensus: () => void;
  resourcesLayerVisible: boolean;
  onToggleResources: () => void;
  resourceFilter: ResourceFilterOption;
  onResourceFilterChange: (filter: ResourceFilterOption) => void;
  businessLayerVisible: boolean;
  onToggleBusinesses: () => void;
  businessFilter: string;
  onBusinessFilterChange: (filter: string) => void;
  businessTypes: { business_type: string; count: number }[];
  compact?: boolean;
  /** The active city name/alias from geography selection (undefined = default Philadelphia) */
  city?: string;
}


interface ToggleButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const ToggleButton = ({ label, active, onClick }: ToggleButtonProps) => {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      size="sm"
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </Button>
  );
};

const MapControlPanel = ({
  heatmapVisible,
  onToggleHeatmap,
  censusLayersVisible,
  onToggleCensusLayers,
  censusBlocks,
  onClearCensus,
  resourcesLayerVisible,
  onToggleResources,
  resourceFilter,
  onResourceFilterChange,
  businessLayerVisible,
  onToggleBusinesses,
  businessFilter,
  onBusinessFilterChange,
  businessTypes,
  compact = false,
  city,
}: MapControlPanelProps) => {
  const nonPhillyCity = city && !isPhiladelphia(city);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground",
        compact ? "p-2" : "p-3"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ToggleButton
          label="Heatmap"
          active={heatmapVisible}
          onClick={onToggleHeatmap}
        />

        <ToggleButton
          label="Census"
          active={censusLayersVisible}
          onClick={onToggleCensusLayers}
        />

        {censusBlocks.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearCensus}
            className="text-muted-foreground hover:text-destructive"
          >
            Clear Selection
          </Button>
        )}

        <ToggleButton
          label="Resources"
          active={resourcesLayerVisible}
          onClick={onToggleResources}
        />

        {resourcesLayerVisible && !nonPhillyCity && (
          <select
            value={resourceFilter}
            onChange={(event) =>
              onResourceFilterChange(event.target.value as ResourceFilterOption)
            }
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label="Community resources filter"
          >
            <option value="all">All resources</option>
            <option value="food">Food</option>
            <option value="shelter">Shelter</option>
            <option value="mental_health">Mental health</option>
          </select>
        )}

        <ToggleButton
          label="Businesses"
          active={businessLayerVisible}
          onClick={onToggleBusinesses}
        />

        {businessLayerVisible && businessTypes.length > 0 && (
          <select
            value={businessFilter}
            onChange={(event) =>
              onBusinessFilterChange(event.target.value)
            }
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label="Business type filter"
          >
            <option value="all">All types</option>
            {businessTypes.map((bt) => (
              <option key={bt.business_type} value={bt.business_type}>
                {bt.business_type} ({bt.count.toLocaleString()})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Philadelphia-only disclaimer */}
      {nonPhillyCity && (
        <div className="mt-2 flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-500">
          <svg
            className="h-3.5 w-3.5 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>Community resources are currently available for Philadelphia only.</span>
        </div>
      )}
    </div>
  );
};

export default MapControlPanel;
