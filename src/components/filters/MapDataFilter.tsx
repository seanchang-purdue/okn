import { useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
} from "@heroui/react";
import { useStore } from "@nanostores/react";
import { filtersStore, dateRangeStore } from "../../stores/filterStore";
import type { Selection, CalendarDate, RangeValue } from "@heroui/react";

import DateRangeSection from "./DateRangeSection";
import FilterSelectionSection from "./FilterSelectionSection";
import FilterOptionsSection from "./FilterOptionsSection";

interface MapDataFilterProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onApplyFilter: () => void;
}

const MapDataFilter = ({
  isOpen,
  onOpenChange,
  onApplyFilter,
}: MapDataFilterProps) => {
  const filtersValue = useStore(filtersStore);
  const dateRangeValue = useStore(
    dateRangeStore
  ) as RangeValue<CalendarDate> | null;

  useEffect(() => {
    if (!filtersValue.selectedKeys) {
      filtersStore.set({ ...filtersValue, selectedKeys: [] });
    }
  }, [filtersValue]);

  const handleDataSelectionChange = (keys: Selection) => {
    const selectedKeys = Array.from(keys) as string[];
    filtersStore.set({ ...filtersValue, selectedKeys });
  };

  const handleFilterChange = (key: string, values: unknown) => {
    filtersStore.set({ ...filtersValue, [key]: values });
  };

  const handleClearFilters = () => {
    filtersStore.set({ selectedKeys: [] });
    dateRangeStore.set(null);
    onApplyFilter();
  };

  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              Filter Map Data
            </DrawerHeader>
            <DrawerBody>
              <div className="flex flex-col gap-6">
                <DateRangeSection
                  dateRangeValue={dateRangeValue}
                  onDateRangeChange={(range) => dateRangeStore.set(range)}
                />

                <FilterSelectionSection
                  selectedKeys={filtersValue.selectedKeys || []}
                  onSelectionChange={handleDataSelectionChange}
                />

                <FilterOptionsSection
                  selectedKeys={filtersValue.selectedKeys || []}
                  filtersValue={filtersValue}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button
                color="danger"
                variant="light"
                onPress={handleClearFilters}
              >
                Clear Filters
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  onClose();
                  onApplyFilter();
                }}
              >
                Apply Filters
              </Button>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default MapDataFilter;
