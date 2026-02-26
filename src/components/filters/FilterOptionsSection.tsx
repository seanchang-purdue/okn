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
  const renderFilterOptions = (key: string) => {
    const filter = filters.find((f) => f.key === key);
    if (!filter) return null;

    if (filter.options) {
      return (
        <CheckboxGroup
          label={filter.label}
          value={filtersValue[key] || []}
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
          value={filtersValue[key] || [20, 40]}
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
