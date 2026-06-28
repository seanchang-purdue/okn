import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { DataMode } from "../../types/filters";

interface DataModeToggleProps {
  value?: DataMode;
  onChange: (value: DataMode) => void;
}

const options: Array<{ label: string; value: DataMode }> = [
  { label: "Incidents", value: "incidents" },
  { label: "Victims", value: "victims" },
];

const DataModeToggle = ({ value = "incidents", onChange }: DataModeToggleProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Label>Data Mode</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default DataModeToggle;
