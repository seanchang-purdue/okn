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
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-caption font-semibold transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-line-1 bg-surface-2 text-ink-1 hover:border-accent/50"
      }`}
    >
      {label}
    </button>
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
      className={`rounded-xl border border-line-1 bg-surface-1 ${compact ? "p-2" : "p-3"}`}
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
          <button
            type="button"
            onClick={onClearCensus}
            className="rounded-full border border-line-1 bg-surface-2 px-3 py-1.5 text-caption font-semibold text-ink-3 transition-colors hover:border-negative/50 hover:text-negative"
          >
            Clear Selection
          </button>
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
            className="rounded-md border border-line-1 bg-surface-1 px-2.5 py-1.5 text-caption text-ink-1 outline-none focus-visible:outline-2"
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
            className="rounded-md border border-line-1 bg-surface-1 px-2.5 py-1.5 text-caption text-ink-1 outline-none focus-visible:outline-2"
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
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-warn/30 bg-warn/10 px-2.5 py-1.5 text-caption text-warn">
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
