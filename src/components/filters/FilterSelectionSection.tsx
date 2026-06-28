import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { filterList as filters } from "../../types/filters";

interface FilterSelectionSectionProps {
  selectedKeys: string[];
  onSelectionChange: (keys: string[]) => void;
}

const FilterSelectionSection = ({
  selectedKeys,
  onSelectionChange,
}: FilterSelectionSectionProps) => {
  const toggleKey = (key: string, checked: boolean) => {
    const next = checked
      ? [...selectedKeys, key]
      : selectedKeys.filter((value) => value !== key);
    onSelectionChange(next);
  };

  const selectedLabels = filters
    .filter((filter) => selectedKeys.includes(filter.key))
    .map((filter) => filter.label);

  return (
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
                selectedLabels.length === 0 ? "text-muted-foreground" : undefined
              }
            >
              {selectedLabels.length > 0
                ? selectedLabels.join(", ")
                : "Select a filter"}
            </span>
            <ChevronDown className="opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
          {filters.map((filter) => (
            <DropdownMenuCheckboxItem
              key={filter.key}
              checked={selectedKeys.includes(filter.key)}
              onCheckedChange={(checked) => toggleKey(filter.key, checked)}
              onSelect={(event) => event.preventDefault()}
            >
              {filter.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FilterSelectionSection;
