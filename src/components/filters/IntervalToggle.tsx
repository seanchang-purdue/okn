import { Button } from "@heroui/react";
import type { IntervalMode } from "../../types/filters";

interface IntervalToggleProps {
  value?: IntervalMode;
  onChange: (value: IntervalMode) => void;
}

const options: Array<{ label: string; value: IntervalMode }> = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
];

const IntervalToggle = ({ value = "yearly", onChange }: IntervalToggleProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Timeline Interval</p>
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

export default IntervalToggle;
