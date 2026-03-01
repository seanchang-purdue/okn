import { CheckboxGroup, Checkbox, Slider } from "@heroui/react";
import { filterList as filters } from "../../types/filters";

interface FilterOptionsSectionProps {
  selectedKeys: string[];
  filtersValue: Record<string, unknown>;
  onFilterChange: (key: string, values: unknown) => void;
}

const FilterOptionsSection = ({
  selectedKeys,
  filtersValue,
  onFilterChange,
}: FilterOptionsSectionProps) => {
  const getStringArrayValue = (key: string) => {
    const raw = filtersValue[key];
    if (!Array.isArray(raw)) return [];
    return raw.map((value) => String(value));
  };

  const getAgeSliderValue = (key: string): number | number[] => {
    const raw = filtersValue[key];
    if (typeof raw === "number") return raw;
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
      return (
        <CheckboxGroup
          label={filter.label}
          value={getStringArrayValue(key)}
          orientation="horizontal"
          onChange={(values) => onFilterChange(key, values)}
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
          value={getAgeSliderValue(key)}
          onChange={(values) => onFilterChange(key, values)}
          className="max-w-md"
        />
      );
    }

    return null;
  };

  return (
    <>
      {selectedKeys.map((key) => (
        <div key={key} className="mt-4">
          {renderFilterOptions(key)}
        </div>
      ))}
    </>
  );
};

export default FilterOptionsSection;
