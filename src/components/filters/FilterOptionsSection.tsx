import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
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

  const getAgeSliderValue = (key: string): number[] => {
    const raw = filtersValue[key];
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
              const isChecked = selected.includes(option);
              const checkboxId = `filter-${key}-${option}`;
              return (
                <div key={option} className="flex items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...selected, option]
                        : selected.filter((value) => value !== option);
                      onFilterChange(key, next);
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
            value={getAgeSliderValue(key)}
            onValueChange={(values) => onFilterChange(key, values)}
          />
        </div>
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
