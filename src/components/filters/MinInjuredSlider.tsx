import { Slider } from "@heroui/react";

interface MinInjuredSliderProps {
  value?: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const MinInjuredSlider = ({
  value = 0,
  onChange,
  min = 0,
  max = 20,
}: MinInjuredSliderProps) => {
  return (
    <div className="max-w-md">
      <Slider
        label="Minimum Injured"
        minValue={min}
        maxValue={max}
        step={1}
        value={value}
        onChange={(nextValue) => {
          const normalized = Array.isArray(nextValue) ? nextValue[0] : nextValue;
          onChange(Math.max(min, Math.min(max, normalized)));
        }}
      />
      <p className="text-default-500 text-xs mt-1">Only incidents with at least {value} injured.</p>
    </div>
  );
};

export default MinInjuredSlider;
