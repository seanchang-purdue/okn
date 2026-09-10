// src/components/datacube/FilterRow.tsx
"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          <span className="text-xs text-muted-foreground">{field.name}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label="Remove filter"
          >
            <X />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {field.values.map((v) => (
            <Badge
              key={String(v)}
              variant={selected.includes(v) ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => toggle(v)}
            >
              {String(v)}
            </Badge>
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
        <span className="text-xs text-muted-foreground">{field.name}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove filter"
        >
          <X />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={min}
          onChange={(e) => updateRange(0, e.target.value)}
          className="h-8 w-20"
          placeholder="min"
        />
        <span className="text-muted-foreground text-xs">to</span>
        <Input
          type="number"
          value={max}
          onChange={(e) => updateRange(1, e.target.value)}
          className="h-8 w-20"
          placeholder="max"
        />
      </div>
      {invalid && (
        <p className="text-xs text-red-600">Min must be ≤ max</p>
      )}
    </div>
  );
}
