import { Switch } from "@heroui/react";

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
    <div className="mt-2 rounded-xl border border-[var(--chat-border)] bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm dark:bg-slate-900/85">
      <p className="mb-2 text-xs font-medium text-[var(--chat-title)] dark:text-slate-100">
        Boundary Layers
      </p>
      <div className="flex flex-col gap-2">
        <Switch
          size="sm"
          isSelected={value.county}
          onValueChange={(next) => setKey("county", next)}
        >
          County
        </Switch>
        <Switch
          size="sm"
          isSelected={value.district}
          onValueChange={(next) => setKey("district", next)}
        >
          District
        </Switch>
        <Switch
          size="sm"
          isSelected={value.neighborhood}
          onValueChange={(next) => setKey("neighborhood", next)}
        >
          Neighborhood
        </Switch>
      </div>
    </div>
  );
};

export default BoundaryLayerSwitcher;
