import { Select, SelectItem } from "@heroui/react";
import { filterList as filters } from "../../types/filters";
import type { Selection } from "@heroui/react";

interface FilterSelectionSectionProps {
  selectedKeys: string[];
  onSelectionChange: (keys: Selection) => void;
}

const FilterSelectionSection = ({
  selectedKeys,
  onSelectionChange,
}: FilterSelectionSectionProps) => {
  return (
    <Select
      label="Data Filters"
      placeholder="Select a filter"
      className="max-w-xs"
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={onSelectionChange}
    >
      {filters.map((filter) => (
        <SelectItem key={filter.key}>{filter.label}</SelectItem>
      ))}
    </Select>
  );
};

export default FilterSelectionSection;
