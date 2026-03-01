import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  filtersStore,
  dateRangeStore,
  DEFAULT_FILTER_VALUES,
  type FilterValues,
} from "../../stores/filterStore";
import type { Selection, CalendarDate, RangeValue } from "@heroui/react";
import type { VictimMode, DataMode, IntervalMode } from "../../types/filters";

import DateRangeSection from "./DateRangeSection";
import FilterSelectionSection from "./FilterSelectionSection";
import FilterOptionsSection from "./FilterOptionsSection";
import VictimModeToggle from "./VictimModeToggle";
import MinKilledSlider from "./MinKilledSlider";
import MinInjuredSlider from "./MinInjuredSlider";
import DataModeToggle from "./DataModeToggle";
import IntervalToggle from "./IntervalToggle";
import IncidentTaxonomyFilters from "../dashboard/IncidentTaxonomyFilters";

interface MapDataFilterProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onApplyFilter: () => void;
  selectedTaxonomy: string[];
  taxonomyCounts: Record<string, number>;
  onTaxonomyChange: (next: string[]) => void;
}

const sectionClassName =
  "rounded-2xl border border-[var(--chat-border)] bg-[color:var(--chat-panel-strong)] p-4";

const MapDataFilter = ({
  isOpen,
  onOpenChange,
  onApplyFilter,
  selectedTaxonomy,
  taxonomyCounts,
  onTaxonomyChange,
}: MapDataFilterProps) => {
  const filtersValue = useStore(filtersStore);
  const dateRangeValue = useStore(
    dateRangeStore
  ) as RangeValue<CalendarDate> | null;

  const mergeFilters = (patch: Partial<FilterValues>) => {
    filtersStore.set({
      ...filtersStore.get(),
      ...patch,
    });
  };

  useEffect(() => {
    if (!Array.isArray(filtersValue.selectedKeys)) {
      filtersStore.set({
        ...filtersStore.get(),
        selectedKeys: [],
      });
    }
  }, [filtersValue.selectedKeys]);

  const handleDataSelectionChange = (keys: Selection) => {
    const selectedKeys = Array.from(keys) as string[];
    mergeFilters({ selectedKeys });
  };

  const handleFilterChange = (key: string, values: unknown) => {
    mergeFilters({ [key]: values } as Partial<FilterValues>);
  };

  const updatePhase2Filter = <K extends keyof FilterValues>(
    key: K,
    value: FilterValues[K]
  ) => {
    mergeFilters({ [key]: value } as Partial<FilterValues>);
  };

  const victimMode =
    (filtersValue.victimMode as VictimMode | undefined) ?? "all";
  const dataMode = (filtersValue.dataMode as DataMode | undefined) ?? "incidents";
  const interval = (filtersValue.interval as IntervalMode | undefined) ?? "yearly";
  const minKilled =
    typeof filtersValue.minKilled === "number" ? filtersValue.minKilled : 0;
  const minInjured =
    typeof filtersValue.minInjured === "number" ? filtersValue.minInjured : 0;

  const handleClearFilters = () => {
    filtersStore.set({ ...DEFAULT_FILTER_VALUES });
    dateRangeStore.set(null);
    onApplyFilter();
  };

  if (!isOpen) return null;

  return (
    <section className="rounded-xl border border-[var(--chat-border)] bg-[color:var(--chat-panel-strong)] p-3">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--chat-border)] pb-2.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--chat-muted)]">
            Map Controls
          </p>
          <h3 className="text-sm font-semibold text-[var(--chat-title)]">
            Filter & Scope
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="apple-notion-icon-btn"
          aria-label="Close filters"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
          >
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="mt-3 max-h-[min(58vh,36rem)] overflow-y-auto pr-1">
        <div className="flex flex-col gap-4">
          <section className={sectionClassName}>
            <div className="mb-3">
              <p className="text-sm font-semibold text-[var(--chat-title)]">
                Date Range
              </p>
              <p className="text-xs text-[var(--chat-muted)]">
                Set timeframe for map and analysis.
              </p>
            </div>
            <DateRangeSection
              dateRangeValue={dateRangeValue}
              onDateRangeChange={(range) => dateRangeStore.set(range)}
            />
          </section>

          <section className={sectionClassName}>
            <div className="mb-3">
              <p className="text-sm font-semibold text-[var(--chat-title)]">
                Incident Taxonomy
              </p>
              <p className="text-xs text-[var(--chat-muted)]">
                Filter map points by category signals.
              </p>
            </div>
            <IncidentTaxonomyFilters
              selected={selectedTaxonomy}
              onChange={onTaxonomyChange}
              counts={taxonomyCounts}
              embedded
            />
          </section>

          <section className={sectionClassName}>
            <div className="mb-3">
              <p className="text-sm font-semibold text-[var(--chat-title)]">
                Victim and Data Controls
              </p>
              <p className="text-xs text-[var(--chat-muted)]">
                Atlas-style severity and timeline controls.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <VictimModeToggle
                value={victimMode}
                onChange={(value) => updatePhase2Filter("victimMode", value)}
              />
              <MinKilledSlider
                value={minKilled}
                onChange={(value) => updatePhase2Filter("minKilled", value)}
              />
              <MinInjuredSlider
                value={minInjured}
                onChange={(value) => updatePhase2Filter("minInjured", value)}
              />
              <DataModeToggle
                value={dataMode}
                onChange={(value) => updatePhase2Filter("dataMode", value)}
              />
              <IntervalToggle
                value={interval}
                onChange={(value) => updatePhase2Filter("interval", value)}
              />
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-3">
              <p className="text-sm font-semibold text-[var(--chat-title)]">
                Data Dimensions
              </p>
              <p className="text-xs text-[var(--chat-muted)]">
                Choose dimensions for advanced filtering.
              </p>
            </div>
            <FilterSelectionSection
              selectedKeys={filtersValue.selectedKeys || []}
              onSelectionChange={handleDataSelectionChange}
            />
          </section>

          <section className={sectionClassName}>
            <div className="mb-3">
              <p className="text-sm font-semibold text-[var(--chat-title)]">
                Dimension Filters
              </p>
              <p className="text-xs text-[var(--chat-muted)]">
                Apply detailed constraints to selected dimensions.
              </p>
            </div>
            <FilterOptionsSection
              selectedKeys={filtersValue.selectedKeys || []}
              filtersValue={filtersValue}
              onFilterChange={handleFilterChange}
            />
          </section>
        </div>
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--chat-border)] pt-3">
        <button
          type="button"
          onClick={handleClearFilters}
          className="rounded-full border border-[var(--chat-border)] bg-[var(--apple-notion-pill)] px-3 py-1.5 text-xs font-semibold text-[var(--chat-muted)] transition-colors hover:border-[var(--chat-accent)]/50 hover:text-[var(--chat-accent)]"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            onApplyFilter();
            onOpenChange(false);
          }}
          className="rounded-full border border-[var(--chat-accent)] bg-[var(--chat-accent)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-full border border-[var(--chat-border)] bg-[color:var(--chat-panel)] px-3 py-1.5 text-xs font-semibold text-[var(--chat-title)] transition-colors hover:border-[var(--chat-accent)]/50 hover:text-[var(--chat-accent)]"
        >
          Cancel
        </button>
      </footer>
    </section>
  );
};

export default MapDataFilter;
