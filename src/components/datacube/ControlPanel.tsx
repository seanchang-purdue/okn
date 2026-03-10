// src/components/datacube/ControlPanel.tsx
"use client";

import { useStore } from "@nanostores/react";
import { Button } from "@heroui/react";
import DimPicker from "./DimPicker";
import AggregationSelect from "./AggregationSelect";
import FilterPanel from "./FilterPanel";
import {
  schemaStore,
  rowDimsStore,
  colDimsStore,
  aggregationStore,
  activeFiltersStore,
  loadingStore,
  resultsStore,
} from "../../stores/datacubeStore";
import type { ActiveFilter } from "../../types/datacube";

interface Props {
  onRunQuery: () => void;
}

function hasInvalidFilter(filters: ActiveFilter[]): boolean {
  return filters.some((f) => {
    if ("range" in f.spec) {
      const [min, max] = f.spec.range;
      return min > max;
    }
    return false;
  });
}

export default function ControlPanel({ onRunQuery }: Props) {
  const schema = useStore(schemaStore);
  const rowDims = useStore(rowDimsStore);
  const colDims = useStore(colDimsStore);
  const aggregation = useStore(aggregationStore);
  const filters = useStore(activeFiltersStore);
  const loading = useStore(loadingStore);
  const results = useStore(resultsStore);

  if (!schema) return <div className="p-4 text-sm text-foreground/40">Loading schema…</div>;

  const noDims = rowDims.length === 0 && colDims.length === 0;
  const invalidFilter = hasInvalidFilter(filters);
  const canRun = !noDims && !invalidFilter && !loading;

  return (
    <aside className="w-80 flex-shrink-0 h-full overflow-y-auto border-r border-default-200 bg-content1 flex flex-col gap-5 p-4">
      <DimPicker
        label="Row Dimensions"
        dimensions={schema.dimensions}
        selected={rowDims}
        otherSelected={colDims}
        onChange={(dims) => rowDimsStore.set(dims)}
      />

      <DimPicker
        label="Col Dimensions"
        dimensions={schema.dimensions}
        selected={colDims}
        otherSelected={rowDims}
        onChange={(dims) => colDimsStore.set(dims)}
      />

      <AggregationSelect
        aggregations={schema.aggregations}
        value={aggregation}
        onChange={(name) => aggregationStore.set(name)}
      />

      <FilterPanel
        filterFields={schema.filter_fields}
        filters={filters}
        onChange={(f) => activeFiltersStore.set(f)}
      />

      <div className="mt-auto flex flex-col gap-1">
        <Button
          color="primary"
          isDisabled={!canRun}
          isLoading={loading}
          onPress={onRunQuery}
          fullWidth
        >
          Run Query
        </Button>
        {results && (
          <p className="text-xs text-center text-foreground/40">
            {results.meta.total_rows} rows · {results.meta.query_ms}ms
          </p>
        )}
        {noDims && (
          <p className="text-xs text-center text-warning">
            Select at least one dimension
          </p>
        )}
      </div>
    </aside>
  );
}
