import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface BoundaryVisibilityState {
  county: boolean;
  district: boolean;
  neighborhood: boolean;
}

interface BoundaryLayerSwitcherProps {
  value: BoundaryVisibilityState;
  onChange: (next: BoundaryVisibilityState) => void;
}

const BoundaryLayerSwitcher = ({ value, onChange }: BoundaryLayerSwitcherProps) => {
  const setKey = (key: keyof BoundaryVisibilityState, nextValue: boolean) => {
    onChange({
      ...value,
      [key]: nextValue,
    });
  };

  return (
    <div className="mt-2 rounded-lg border border-border bg-card px-3 py-2 text-card-foreground shadow-sm">
      <p className="mb-2 text-xs font-medium text-foreground">Boundary Layers</p>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Switch
            id="boundary-county"
            checked={value.county}
            onCheckedChange={(next) => setKey("county", next)}
          />
          <Label htmlFor="boundary-county" className="text-sm font-normal">
            County
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="boundary-district"
            checked={value.district}
            onCheckedChange={(next) => setKey("district", next)}
          />
          <Label htmlFor="boundary-district" className="text-sm font-normal">
            District
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="boundary-neighborhood"
            checked={value.neighborhood}
            onCheckedChange={(next) => setKey("neighborhood", next)}
          />
          <Label htmlFor="boundary-neighborhood" className="text-sm font-normal">
            Neighborhood
          </Label>
        </div>
      </div>
    </div>
  );
};

export default BoundaryLayerSwitcher;
