import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

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
    <div className="flex max-w-md flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Minimum Injured</Label>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([nextValue]) => {
          onChange(Math.max(min, Math.min(max, nextValue)));
        }}
      />
      <p className="text-xs text-muted-foreground">
        Only incidents with at least {value} injured.
      </p>
    </div>
  );
};

export default MinInjuredSlider;
