// src/components/datacube/AggregationSelect.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AggregationInfo } from "../../types/datacube";

interface Props {
  aggregations: AggregationInfo[];
  value: string;
  onChange: (name: string) => void;
}

export default function AggregationSelect({
  aggregations,
  value,
  onChange,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Aggregation
      </label>
      <Select
        value={value || undefined}
        onValueChange={(selected) => {
          if (selected) onChange(selected);
        }}
      >
        <SelectTrigger size="sm" className="w-full" aria-label="Aggregation function">
          <SelectValue placeholder="Select aggregation" />
        </SelectTrigger>
        <SelectContent>
          {aggregations.map((agg) => (
            <SelectItem key={agg.name} value={agg.name} title={agg.description}>
              {agg.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
