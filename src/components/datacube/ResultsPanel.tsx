// src/components/datacube/ResultsPanel.tsx
"use client";

import { useStore } from "@nanostores/react";
import {
  resultsStore,
  loadingStore,
  errorStore,
  displayModeStore,
  lockedModeStore,
  rowDimsStore,
} from "../../stores/datacubeStore";
import ChartTypeSelector from "./ChartTypeSelector";
import PivotTable from "./PivotTable";
import CubeChart from "./CubeChart";
import type { DisplayMode } from "../../types/datacube";

const TIME_DIMS = new Set(["year", "month", "season", "date", "week"]);

function autoDetectMode(rowDims: string[]): "bar" | "line" {
  return rowDims.some((d) => TIME_DIMS.has(d.toLowerCase())) ? "line" : "bar";
}

export default function ResultsPanel() {
  const results = useStore(resultsStore);
  const loading = useStore(loadingStore);
  const error = useStore(errorStore);
  const displayMode = useStore(displayModeStore);
  const lockedMode = useStore(lockedModeStore);
  const rowDims = useStore(rowDimsStore);

  const autoDetected = autoDetectMode(rowDims);
  const effectiveMode: DisplayMode = lockedMode ?? (displayMode === "table" ? "table" : autoDetected);

  const handleModeChange = (mode: DisplayMode) => {
    lockedModeStore.set(mode);
    displayModeStore.set(mode);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-default-200 bg-content1">
        <h2 className="text-sm font-semibold text-foreground/70">Results</h2>
        <ChartTypeSelector
          current={effectiveMode}
          autoDetected={autoDetected}
          locked={!!lockedMode}
          onChange={handleModeChange}
        />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="h-full flex items-center justify-center">
            <span className="text-foreground/40 text-sm animate-pulse">Running query…</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {!loading && !error && !results && (
          <div className="h-full flex items-center justify-center">
            <p className="text-foreground/30 text-sm text-center max-w-xs">
              Select dimensions and click Run Query to explore the data.
            </p>
          </div>
        )}

        {!loading && !error && results && (
          <div className="h-full">
            {effectiveMode === "table" ? (
              <PivotTable result={results} />
            ) : (
              <div style={{ height: "100%", minHeight: 320 }}>
                <CubeChart result={results} mode={effectiveMode} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
