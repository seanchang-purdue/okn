// src/components/datacube/DataCubeApp.tsx
"use client";

import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import Link from "next/link";
import DarkmodeButton from "../utils/DarkmodeButton";
import ControlPanel from "./ControlPanel";
import ResultsPanel from "./ResultsPanel";
import {
  schemaStore,
  rowDimsStore,
  colDimsStore,
  aggregationStore,
  activeFiltersStore,
  loadingStore,
  errorStore,
  resultsStore,
  lockedModeStore,
} from "../../stores/datacubeStore";
import {
  fetchSchema,
  queryDatacube,
  ValidationError,
  QueryError,
} from "../../services/datacubeService";
import type { FilterSpec } from "../../types/datacube";

export default function DataCubeApp() {
  const schema = useStore(schemaStore);

  useEffect(() => {
    fetchSchema()
      .then((s) => {
        schemaStore.set(s);
        if (s.aggregations.length > 0) {
          aggregationStore.set(s.aggregations[0].name);
        }
      })
      .catch(() => {
        errorStore.set("Failed to load schema. Please refresh.");
      });
  }, []);

  const handleRunQuery = async () => {
    const rowDims = rowDimsStore.get();
    const colDims = colDimsStore.get();
    const aggregation = aggregationStore.get();
    const activeFilters = activeFiltersStore.get();

    loadingStore.set(true);
    errorStore.set(null);
    lockedModeStore.set(null);

    const filters: Record<string, FilterSpec> = {};
    for (const f of activeFilters) {
      if ("in" in f.spec && (f.spec.in as (string | number)[]).length === 0) continue;
      filters[f.fieldName] = f.spec;
    }

    try {
      const result = await queryDatacube({
        row_dims: rowDims,
        col_dims: colDims,
        aggregation,
        ...(Object.keys(filters).length > 0 ? { filters } : {}),
      });
      resultsStore.set(result);
    } catch (err) {
      if (err instanceof ValidationError) {
        errorStore.set(`Invalid selection: ${err.detail}`);
      } else if (err instanceof QueryError) {
        errorStore.set("Too many results — add more filters to narrow the data.");
      } else {
        errorStore.set("Something went wrong. Try again.");
      }
    } finally {
      loadingStore.set(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--chat-bg)]">
      <header className="flex items-center justify-between px-4 py-2 border-b border-default-200 bg-content1 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-foreground/50 hover:text-foreground transition-colors">
            ← Map
          </Link>
          <h1 className="font-semibold text-foreground">Data Cube Explorer</h1>
        </div>
        <DarkmodeButton />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ControlPanel onRunQuery={handleRunQuery} />
        <ResultsPanel />
      </div>
    </div>
  );
}
