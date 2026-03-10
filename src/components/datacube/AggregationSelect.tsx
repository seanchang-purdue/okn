// src/components/datacube/AggregationSelect.tsx
"use client";

import { Select, SelectItem, Tooltip } from "@heroui/react";
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
      <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
        Aggregation
      </label>
      <Select
        size="sm"
        selectedKeys={value ? new Set([value]) : new Set()}
        onSelectionChange={(keys) => {
          const selected = [...keys][0] as string;
          if (selected) onChange(selected);
        }}
        aria-label="Aggregation function"
      >
        {aggregations.map((agg) => (
          <SelectItem key={agg.name} textValue={agg.label}>
            <Tooltip content={agg.description} placement="right">
              <span>{agg.label}</span>
            </Tooltip>
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
