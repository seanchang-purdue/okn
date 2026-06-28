import { useEffect, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useStore } from "@nanostores/react";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
import { filtersStore, dateRangeStore } from "../../stores/filterStore";
import type { DateRangeValue } from "../../stores/filterStore";
import { filterList as filters } from "../../types/filters";
import type { FilterKey } from "../../types/filters";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MapDataFilterProps = {
  onApplyFilter: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const toDate = (value: CalendarDate) => value.toDate(getLocalTimeZone());

const toCalendarDate = (value: Date) =>
  new CalendarDate(value.getFullYear(), value.getMonth() + 1, value.getDate());

const MapDataFilter = ({
  onApplyFilter,
  isOpen,
  onOpenChange,
}: MapDataFilterProps) => {
  const filtersValue = useStore(filtersStore);
  const dynamicFilters = filtersValue as Record<string, unknown>;
  const dateRangeValue = useStore(dateRangeStore);

  const maxDate = useMemo(() => new Date(), []);
  const minDate = useMemo(() => new Date(2015, 0, 1), []);

  const selectedRange: DateRange | undefined = useMemo(() => {
    if (!dateRangeValue) return undefined;
    return {
      from: toDate(dateRangeValue.start),
      to: toDate(dateRangeValue.end),
    };
  }, [dateRangeValue]);

  const rangeLabel = useMemo(() => {
    if (!dateRangeValue) return "--";
    const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: "long" });
    return `${formatter.format(toDate(dateRangeValue.start))} – ${formatter.format(
      toDate(dateRangeValue.end)
    )}`;
  }, [dateRangeValue]);

  useEffect(() => {
    // Initialize selectedKeys in filtersStore if not present
    if (!filtersValue.selectedKeys) {
      filtersStore.set({ ...filtersValue, selectedKeys: [] });
    }
  }, [filtersValue]);

  const selectedKeys = filtersValue.selectedKeys ?? [];

  const toggleDataKey = (key: FilterKey, checked: boolean) => {
    const next = checked
      ? [...selectedKeys, key]
      : selectedKeys.filter((value) => value !== key);
    filtersStore.set({ ...filtersValue, selectedKeys: next });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) {
      dateRangeStore.set(null);
      return;
    }
    const next: DateRangeValue = {
      start: toCalendarDate(range.from),
      end: toCalendarDate(range.to),
    };
    dateRangeStore.set(next);
  };

  const setDynamicFilterValue = (key: string, value: unknown) => {
    filtersStore.set({
      ...filtersValue,
      [key]: value,
    } as typeof filtersValue);
  };

  const getStringArrayValue = (key: string) => {
    const raw = dynamicFilters[key];
    if (!Array.isArray(raw)) return [];
    return raw.map((value) => String(value));
  };

  const getAgeValue = (key: string): number[] => {
    const raw = dynamicFilters[key];
    if (typeof raw === "number") return [raw];
    if (Array.isArray(raw)) {
      const numeric = raw.filter((value): value is number => typeof value === "number");
      if (numeric.length > 0) return numeric;
    }
    return [20, 40];
  };

  const renderFilterOptions = (key: string) => {
    const filter = filters.find((f) => f.key === key);
    if (!filter) return null;

    if (filter.options) {
      const selected = getStringArrayValue(key);
      return (
        <div className="flex flex-col gap-2">
          <Label>{filter.label}</Label>
          <div className="flex flex-wrap gap-4">
            {filter.options.map((option) => {
              const checkboxId = `legacy-filter-${key}-${option}`;
              const isChecked = selected.includes(option);
              return (
                <div key={option} className="flex items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...selected, option]
                        : selected.filter((value) => value !== option);
                      setDynamicFilterValue(key, next);
                    }}
                  />
                  <Label htmlFor={checkboxId} className="font-normal">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (key === "age") {
      return (
        <div className="flex max-w-md flex-col gap-2">
          <Label>{filter.label}</Label>
          <Slider
            step={1}
            min={0}
            max={100}
            value={getAgeValue(key)}
            onValueChange={(values) => {
              const normalizedValue = values.length > 1 ? values : values[0];
              setDynamicFilterValue(key, normalizedValue);
            }}
          />
        </div>
      );
    }

    return null;
  };

  const selectedFilterLabels = filters
    .filter((filter) => selectedKeys.includes(filter.key))
    .map((filter) => filter.label);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-4 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>Data Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="max-w-sm justify-start font-normal"
              >
                <CalendarIcon className="opacity-70" />
                {rangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                numberOfMonths={2}
                defaultMonth={selectedRange?.from}
                selected={selectedRange}
                onSelect={handleDateRangeChange}
                disabled={{ before: minDate, after: maxDate }}
              />
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground">Selected date: {rangeLabel}</p>
        </div>

        <div className="flex max-w-xs flex-col gap-2">
          <Label>Data Filters</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
              >
                <span
                  className={
                    selectedFilterLabels.length === 0
                      ? "text-muted-foreground"
                      : undefined
                  }
                >
                  {selectedFilterLabels.length > 0
                    ? selectedFilterLabels.join(", ")
                    : "Select a filter"}
                </span>
                <ChevronDown className="opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-(--radix-dropdown-menu-trigger-width)"
            >
              {filters.map((filter) => (
                <DropdownMenuCheckboxItem
                  key={filter.key}
                  checked={selectedKeys.includes(filter.key)}
                  onCheckedChange={(checked) =>
                    toggleDataKey(filter.key, checked)
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  {filter.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedKeys.map((key) => (
          <div key={key} className="mt-4">
            {renderFilterOptions(key)}
          </div>
        ))}

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              onClick={() => {
                onApplyFilter();
              }}
            >
              Apply
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              filtersStore.set({ selectedKeys: [] });
              dateRangeStore.set(null);
              onApplyFilter();
            }}
          >
            Clear Filters
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapDataFilter;
