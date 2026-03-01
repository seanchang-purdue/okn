import { Slider } from "@heroui/react";

interface MinKilledSliderProps {
  value?: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const MinKilledSlider = ({
  value = 0,
  onChange,
  min = 0,
  max = 10,
}: MinKilledSliderProps) => {
  return (
    <div className="max-w-md">
      <Slider
        label="Minimum Killed"
        minValue={min}
        maxValue={max}
        step={1}
        value={value}
        onChange={(nextValue) => {
          const normalized = Array.isArray(nextValue) ? nextValue[0] : nextValue;
          onChange(Math.max(min, Math.min(max, normalized)));
        }}
      />
      <p className="text-default-500 text-xs mt-1">Only incidents with at least {value} killed.</p>
    </div>
  );
};

export default MinKilledSlider;
