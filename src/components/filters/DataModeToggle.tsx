import { Button } from "@heroui/react";
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
      <p className="text-sm font-medium">Data Mode</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <Button
              key={option.value}
              size="sm"
              color={isActive ? "primary" : "default"}
              variant={isActive ? "solid" : "flat"}
              onPress={() => onChange(option.value)}
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
