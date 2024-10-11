import { useEffect } from "react";
import {
  Button,
  DateRangePicker,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Checkbox,
  CheckboxGroup,
  useDisclosure,
  Slider,
} from "@nextui-org/react";
import type { CalendarDate, RangeValue, Selection } from "@nextui-org/react";
import { useStore } from "@nanostores/react";
import { filtersStore, dateRangeStore } from "../../stores/filterStore";
import { parseDate, getLocalTimeZone } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { filterList as filters } from "../../../types/filters";

type MapDataFilterProps = {
  onApplyFilter: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const MapDataFilter = ({
  onApplyFilter,
  isOpen,
  onOpenChange,
}: MapDataFilterProps) => {
  const filtersValue = useStore(filtersStore);
  const dateRangeValue = useStore(dateRangeStore);
  const formatter = useDateFormatter({ dateStyle: "long" });
  
  useEffect(() => {
    // Initialize selectedKeys in filtersStore if not present
    if (!filtersValue.selectedKeys) {
      console.log("setting selectedKeys");
      filtersStore.set({ ...filtersValue, selectedKeys: [] });
    }
  }, [filtersValue]);

  const handleDataSelectionChange = (keys: Selection) => {
    const selectedKeys = Array.from(keys) as string[];
    filtersStore.set({ ...filtersValue, selectedKeys });
  };

  const handleDemographSelectionChange = (keys: Selection) => {
    const demographic = Array.from(keys) as string[];
    filtersStore.set({ ...filtersValue, demographic });
  };

  const handleDateRangeChange = (range: RangeValue<CalendarDate>) => {
    dateRangeStore.set(range);
  };

  const renderFilterOptions = (key: string) => {
    const filter = filters.find((f) => f.key === key);
    if (!filter) return null;

    if (filter.options) {
      return (
        <CheckboxGroup
          label={filter.label}
          value={filtersValue[key] || []}
          orientation="horizontal"
          onChange={(values) => {
            filtersStore.set({ ...filtersValue, [key]: values });
          }}
        >
          {filter.options.map((option) => (
            <Checkbox key={option} value={option}>
              {option}
            </Checkbox>
          ))}
        </CheckboxGroup>
      );
    }

    if (key === "age") {
      return (
        <Slider
          label={filter.label}
          step={1}
          minValue={0}
          maxValue={100}
          value={filtersValue[key] || [20, 40]}
          onChange={(values) => {
            filtersStore.set({ ...filtersValue, [key]: values });
          }}
          className="max-w-md"
        />
      );
    }

    return null;
  };

  return (
    <div className="flex flex-row space-x-4 items-center justify-center w-2/3">
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="z-50"
        scrollBehavior="inside"
        size="3xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Filters</ModalHeader>
              <ModalBody>
                <div className="w-full flex flex-col gap-y-2">
                  <DateRangePicker
                    className="max-w-sm"
                    label="Data Date Range"
                    minValue={parseDate("2023-01-01")}
                    value={dateRangeValue}
                    onChange={handleDateRangeChange}
                  />
                  <p className="text-default-500 text-sm">
                    Selected date:{" "}
                    {dateRangeValue
                      ? formatter.formatRange(
                          dateRangeValue.start.toDate(getLocalTimeZone()),
                          dateRangeValue.end.toDate(getLocalTimeZone()),
                        )
                      : "--"}
                  </p>
                </div>
                <Select
                  label="Data Filters"
                  placeholder="Select a filter"
                  className="max-w-xs"
                  selectionMode="multiple"
                  selectedKeys={filtersValue.selectedKeys}
                  onSelectionChange={handleDataSelectionChange}
                >
                  {filters.map((filter) => (
                    <SelectItem key={filter.key} value={filter.key}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </Select>
                {filtersValue.selectedKeys &&
                  filtersValue.selectedKeys.map((key) => (
                    <div key={key} className="mt-4">
                      {renderFilterOptions(key)}
                    </div>
                  ))}
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  onPress={() => {
                    onClose();
                    onApplyFilter();
                  }}
                >
                  Apply
                </Button>
                <Button
                  color="primary"
                  variant="ghost"
                  onClick={() => {
                    filtersStore.set({ selectedKeys: [] });
                    dateRangeStore.set(null);
                    onApplyFilter();
                  }}
                >
                  Clear Filters
                </Button>
                <Button onPress={onClose}>Cancel</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default MapDataFilter;
