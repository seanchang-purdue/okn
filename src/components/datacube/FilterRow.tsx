// src/components/datacube/FilterRow.tsx
"use client";

import { Button, Chip } from "@heroui/react";
import type { DimensionInfo, FilterSpec } from "../../types/datacube";

interface Props {
  field: DimensionInfo;
  spec: FilterSpec;
  onChange: (spec: FilterSpec) => void;
  onRemove: () => void;
}

export default function FilterRow({ field, spec, onChange, onRemove }: Props) {
  if (field.type === "enum" && field.values) {
    const selected =
      "in" in spec ? (spec.in as (string | number)[]) : [];

    const toggle = (v: string | number) => {
      const next = selected.includes(v)
        ? selected.filter((x) => x !== v)
        : [...selected, v];
      onChange({ in: next });
    };

    return (
      <div className="flex flex-col gap-1 py-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/70">{field.name}</span>
          <Button isIconOnly size="sm" variant="light" onPress={onRemove} aria-label="Remove filter">
            ×
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {field.values.map((v) => (
            <Chip
              key={String(v)}
              size="sm"
              variant={selected.includes(v) ? "solid" : "flat"}
              color={selected.includes(v) ? "primary" : "default"}
              className="cursor-pointer"
              onClick={() => toggle(v)}
            >
              {String(v)}
            </Chip>
          ))}
        </div>
      </div>
    );
  }

  const rangeSpec = "range" in spec ? spec.range : [0, 0];
  const [min, max] = rangeSpec as [number, number];
  const invalid = min > max;

  const updateRange = (index: 0 | 1, raw: string) => {
    const val = Number(raw);
    const next: [number, number] = index === 0 ? [val, max] : [min, val];
    onChange({ range: next });
  };

  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/70">{field.name}</span>
        <Button isIconOnly size="sm" variant="light" onPress={onRemove} aria-label="Remove filter">
          ×
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={min}
          onChange={(e) => updateRange(0, e.target.value)}
          className="w-20 px-2 py-1 text-sm rounded border border-default-200 bg-content1 text-foreground"
          placeholder="min"
        />
        <span className="text-foreground/40 text-xs">to</span>
        <input
          type="number"
          value={max}
          onChange={(e) => updateRange(1, e.target.value)}
          className="w-20 px-2 py-1 text-sm rounded border border-default-200 bg-content1 text-foreground"
          placeholder="max"
        />
      </div>
      {invalid && (
        <p className="text-xs text-danger">Min must be ≤ max</p>
      )}
    </div>
  );
}
