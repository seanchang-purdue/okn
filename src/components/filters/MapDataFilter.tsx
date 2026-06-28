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
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MapDataFilterProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onApplyFilter: () => void;
  selectedTaxonomy: string[];
  taxonomyCounts: Record<string, number>;
  onTaxonomyChange: (next: string[]) => void;
}

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
    <Card className="gap-0 py-4">
      <CardHeader className="border-b px-4 pb-4">
        <CardTitle className="text-sm font-semibold text-foreground">
          Filter &amp; Scope
        </CardTitle>
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          Map Controls
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            aria-label="Close filters"
          >
            <X />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-4 pt-4">
        <div className="max-h-[min(58vh,36rem)] overflow-y-auto pr-1">
          <div className="flex flex-col gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Date Range
                </p>
                <p className="text-xs text-muted-foreground">
                  Set timeframe for map and analysis.
                </p>
              </div>
              <DateRangeSection
                dateRangeValue={dateRangeValue}
                onDateRangeChange={(range) => dateRangeStore.set(range)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Incident Taxonomy
                </p>
                <p className="text-xs text-muted-foreground">
                  Filter map points by category signals.
                </p>
              </div>
              <IncidentTaxonomyFilters
                selected={selectedTaxonomy}
                onChange={onTaxonomyChange}
                counts={taxonomyCounts}
                embedded
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Victim and Data Controls
                </p>
                <p className="text-xs text-muted-foreground">
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
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Data Dimensions
                </p>
                <p className="text-xs text-muted-foreground">
                  Choose dimensions for advanced filtering.
                </p>
              </div>
              <FilterSelectionSection
                selectedKeys={filtersValue.selectedKeys || []}
                onSelectionChange={handleDataSelectionChange}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Dimension Filters
                </p>
                <p className="text-xs text-muted-foreground">
                  Apply detailed constraints to selected dimensions.
                </p>
              </div>
              <FilterOptionsSection
                selectedKeys={filtersValue.selectedKeys || []}
                filtersValue={filtersValue}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-4 flex-wrap justify-end gap-2 border-t px-4 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
        >
          Reset
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            onApplyFilter();
            onOpenChange(false);
          }}
        >
          Apply
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MapDataFilter;
