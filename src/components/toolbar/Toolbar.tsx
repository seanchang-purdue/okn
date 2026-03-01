import { useEffect, useRef, useState } from "react";
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
  city?: string;
  chartTrigger: number;
  onToolbarHeightChange?: (height: number) => void;
}

type ContextPanel = "none" | "tools" | "filters" | "charts";

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
    <div className="pointer-events-none absolute left-3 right-3 top-3 z-30">
      <div
        ref={panelRef}
        className="pointer-events-auto w-full md:max-w-[min(44rem,calc(100vw-27rem))]"
      >
        <div className="rounded-2xl border border-[var(--chat-border)] bg-[color:var(--chat-panel)]/90 p-2 backdrop-blur-sm">
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
              <button
                type="button"
                onClick={() => togglePanel("tools")}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  activePanel === "tools"
                    ? "border-[var(--chat-accent)] bg-[var(--chat-accent-soft)] text-[var(--chat-accent)]"
                    : "border-[var(--chat-border)] bg-[color:var(--chat-panel-strong)] text-[var(--chat-title)]"
                }`}
                aria-pressed={activePanel === "tools"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  className="h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h7" />
                  <circle cx="17" cy="12" r="2" fill="currentColor" stroke="none" />
                </svg>
                <span className="hidden sm:inline">Tools</span>
              </button>
              <button
                type="button"
                onClick={() => togglePanel("filters")}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  activePanel === "filters"
                    ? "border-[var(--chat-accent)] bg-[var(--chat-accent-soft)] text-[var(--chat-accent)]"
                    : "border-[var(--chat-border)] bg-[color:var(--chat-panel-strong)] text-[var(--chat-title)]"
                }`}
                aria-pressed={activePanel === "filters"}
              >
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
                <span className="hidden sm:inline">Filters</span>
              </button>
              <button
                type="button"
                onClick={() => togglePanel("charts")}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  activePanel === "charts"
                    ? "border-[var(--chat-accent)] bg-[var(--chat-accent-soft)] text-[var(--chat-accent)]"
                    : "border-[var(--chat-border)] bg-[color:var(--chat-panel-strong)] text-[var(--chat-title)]"
                }`}
                aria-pressed={activePanel === "charts"}
              >
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
                <span className="hidden sm:inline">Charts</span>
              </button>
            </div>
          </div>

          {activePanel === "tools" && (
            <div className="mt-2">
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
                city={city}
                compact
              />
            </div>
          )}

          {activePanel === "filters" && (
            <div className="mt-2">
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
            <div className="mt-2">
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
