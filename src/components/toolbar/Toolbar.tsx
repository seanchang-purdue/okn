import { useEffect, useRef, useState, type ReactNode } from "react";
import GeographySearchInput from "../geography/GeographySearchInput";
import GeographyScopeCard from "../geography/GeographyScopeCard";
import MapControlPanel from "../map/MapControlPanel";
import MapDataFilter from "../filters/MapDataFilter";
import OknCharts from "../charts/OknCharts";
import type { GeographyResult } from "../../hooks/useGeographySearch";
import type { ResourceFilterOption } from "../buttons/CommunityResourcesLayerButton";

interface ToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: GeographyResult[];
  loading: boolean;
  error: string;
  onSelect: (result: GeographyResult) => void;
  onClearSearch: () => void;
  selectedGeography: { label: string; type: string } | null;
  onClearSelection: () => void;
  onApplyFilter: () => void;
  selectedTaxonomy: string[];
  taxonomyCounts: Record<string, number>;
  onTaxonomyChange: (next: string[]) => void;
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
  city?: string;
  chartTrigger: number;
  onToolbarHeightChange?: (height: number) => void;
}

type ContextPanel = "none" | "tools" | "filters" | "charts";

interface PanelToggleProps {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
  controlsId: string;
}

const PanelToggle = ({
  label,
  icon,
  active,
  onClick,
  controlsId,
}: PanelToggleProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-caption font-semibold transition-colors ${
      active
        ? "border-accent bg-accent-soft text-accent"
        : "border-line-1 bg-surface-1 text-ink-1 hover:border-accent/50"
    }`}
    aria-expanded={active}
    aria-controls={controlsId}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-3.5 w-3.5 transition-transform ${active ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  </button>
);

const Toolbar = ({
  query,
  onQueryChange,
  results,
  loading,
  error,
  onSelect,
  onClearSearch,
  selectedGeography,
  onClearSelection,
  onApplyFilter,
  selectedTaxonomy,
  taxonomyCounts,
  onTaxonomyChange,
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
  city,
  chartTrigger,
  onToolbarHeightChange,
}: ToolbarProps) => {
  const [activePanel, setActivePanel] = useState<ContextPanel>("none");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onToolbarHeightChange || !panelRef.current) return;

    const updateHeight = () => {
      if (!panelRef.current) return;
      const height = Math.ceil(panelRef.current.getBoundingClientRect().height);
      onToolbarHeightChange(height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(panelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onToolbarHeightChange]);

  const togglePanel = (panel: Exclude<ContextPanel, "none">) => {
    setActivePanel((current) => (current === panel ? "none" : panel));
  };

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-30 flex justify-start">
      <div
        ref={panelRef}
        className="pointer-events-auto w-full md:w-[min(38rem,calc(100%-1.5rem))]"
      >
        <div className="rounded-xl border border-line-1 bg-surface-1/90 p-2 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <GeographySearchInput
                query={query}
                onQueryChange={onQueryChange}
                results={results}
                loading={loading}
                error={error}
                onSelect={onSelect}
                onClear={onClearSearch}
              />

              {selectedGeography && (
                <GeographyScopeCard
                  label={selectedGeography.label}
                  type={selectedGeography.type}
                  onClear={onClearSelection}
                />
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <PanelToggle
                label="Tools"
                active={activePanel === "tools"}
                onClick={() => togglePanel("tools")}
                controlsId="toolbar-panel-tools"
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 7h16M4 12h10M4 17h7"
                    />
                    <circle cx="17" cy="12" r="2" fill="currentColor" stroke="none" />
                  </svg>
                }
              />
              <PanelToggle
                label="Filters"
                active={activePanel === "filters"}
                onClick={() => togglePanel("filters")}
                controlsId="toolbar-panel-filters"
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M7 12h10M10 18h4"
                    />
                  </svg>
                }
              />
              <PanelToggle
                label="Charts"
                active={activePanel === "charts"}
                onClick={() => togglePanel("charts")}
                controlsId="toolbar-panel-charts"
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 18V6M10 18v-8M16 18v-5M22 18v-9"
                    />
                  </svg>
                }
              />
              <span aria-hidden className="mx-1 h-5 w-px bg-line-1" />
              <a
                href="/datacube"
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-caption font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-accent"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  className="h-4 w-4"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span className="hidden sm:inline">Data Cube</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-3 w-3"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
            </div>
          </div>

          {activePanel === "tools" && (
            <div id="toolbar-panel-tools" className="mt-2">
              <MapControlPanel
                heatmapVisible={heatmapVisible}
                onToggleHeatmap={onToggleHeatmap}
                censusLayersVisible={censusLayersVisible}
                onToggleCensusLayers={onToggleCensusLayers}
                censusBlocks={censusBlocks}
                onClearCensus={onClearCensus}
                resourcesLayerVisible={resourcesLayerVisible}
                onToggleResources={onToggleResources}
                resourceFilter={resourceFilter}
                onResourceFilterChange={onResourceFilterChange}
                businessLayerVisible={businessLayerVisible}
                onToggleBusinesses={onToggleBusinesses}
                businessFilter={businessFilter}
                onBusinessFilterChange={onBusinessFilterChange}
                businessTypes={businessTypes}
                city={city}
                compact
              />
            </div>
          )}

          {activePanel === "filters" && (
            <div id="toolbar-panel-filters" className="mt-2">
              <MapDataFilter
                isOpen={activePanel === "filters"}
                onOpenChange={(nextOpen) =>
                  setActivePanel(nextOpen ? "filters" : "none")
                }
                onApplyFilter={onApplyFilter}
                selectedTaxonomy={selectedTaxonomy}
                taxonomyCounts={taxonomyCounts}
                onTaxonomyChange={onTaxonomyChange}
              />
            </div>
          )}

          {activePanel === "charts" && (
            <div id="toolbar-panel-charts" className="mt-2">
              <OknCharts
                censusBlock={censusBlocks}
                trigger={chartTrigger}
                isOpen={activePanel === "charts"}
                onOpenChange={(open) => setActivePanel(open ? "charts" : "none")}
                variant="inline"
                showCloseButton={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
