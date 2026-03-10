// src/components/datacube/FilterPanel.tsx
"use client";

import { useState } from "react";
import { Button, Popover, PopoverTrigger, PopoverContent, Listbox, ListboxItem } from "@heroui/react";
import FilterRow from "./FilterRow";
import type { DimensionInfo, ActiveFilter, FilterSpec } from "../../types/datacube";

interface Props {
  filterFields: DimensionInfo[];
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
}

export default function FilterPanel({ filterFields, filters, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const activeNames = new Set(filters.map((f) => f.fieldName));
  const available = filterFields.filter((f) => !activeNames.has(f.name));

  const addFilter = (fieldName: string) => {
    const field = filterFields.find((f) => f.name === fieldName)!;
    const defaultSpec: FilterSpec =
      field.type === "enum" ? { in: [] } : { range: [0, 0] };
    onChange([...filters, { fieldName, spec: defaultSpec }]);
    setOpen(false);
  };

  const updateFilter = (index: number, spec: FilterSpec) => {
    const next = [...filters];
    next[index] = { ...next[index], spec };
    onChange(next);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
          Filters
          {filters.length > 0 && (
            <span className="ml-1 text-primary">{filters.length}</span>
          )}
        </label>
        <Popover isOpen={open} onOpenChange={setOpen} placement="bottom-end">
          <PopoverTrigger>
            <Button size="sm" variant="flat" isDisabled={available.length === 0}>
              + Add filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-48">
            <Listbox aria-label="Filter fields" onAction={(key) => addFilter(key as string)}>
              {available.map((f) => (
                <ListboxItem key={f.name}>{f.name}</ListboxItem>
              ))}
            </Listbox>
          </PopoverContent>
        </Popover>
      </div>

      {filters.map((f, i) => {
        const field = filterFields.find((ff) => ff.name === f.fieldName);
        if (!field) return null;
        return (
          <FilterRow
            key={f.fieldName}
            field={field}
            spec={f.spec}
            onChange={(spec) => updateFilter(i, spec)}
            onRemove={() => removeFilter(i)}
          />
        );
      })}
    </div>
  );
}
