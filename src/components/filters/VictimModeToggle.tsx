import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
      <Label>Victim Mode</Label>
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

export default VictimModeToggle;
