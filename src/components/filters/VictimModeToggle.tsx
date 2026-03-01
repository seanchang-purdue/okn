import { Button } from "@heroui/react";
import type { VictimMode } from "../../types/filters";

interface VictimModeToggleProps {
  value?: VictimMode;
  onChange: (value: VictimMode) => void;
}

const options: Array<{ label: string; value: VictimMode }> = [
  { label: "All", value: "all" },
  { label: "Fatal", value: "fatal" },
  { label: "Nonfatal", value: "nonfatal" },
];

const VictimModeToggle = ({ value = "all", onChange }: VictimModeToggleProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Victim Mode</p>
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

export default VictimModeToggle;
