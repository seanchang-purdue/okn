// src/components/datacube/DimPicker.tsx
"use client";

import { useState } from "react";
import { Chip, Button, Listbox, ListboxItem, Popover, PopoverTrigger, PopoverContent, Input } from "@heroui/react";
import type { DimensionInfo } from "../../types/datacube";

interface Props {
  label: string;
  dimensions: DimensionInfo[];
  selected: string[];
  otherSelected: string[];
  onChange: (dims: string[]) => void;
}

export default function DimPicker({
  label,
  dimensions,
  selected,
  otherSelected,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const available = dimensions.filter(
    (d) =>
      !selected.includes(d.name) &&
      !otherSelected.includes(d.name) &&
      d.name.toLowerCase().includes(search.toLowerCase())
  );

  const add = (name: string) => {
    onChange([...selected, name]);
    setSearch("");
    setOpen(false);
  };

  const remove = (name: string) => {
    onChange(selected.filter((d) => d !== name));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </label>

      <div className="flex flex-wrap gap-1 min-h-[32px]">
        {selected.map((name) => (
          <Chip
            key={name}
            size="sm"
            onClose={() => remove(name)}
            variant="flat"
            color="primary"
          >
            {name}
          </Chip>
        ))}
      </div>

      <Popover isOpen={open} onOpenChange={setOpen} placement="bottom-start">
        <PopoverTrigger>
          <Button size="sm" variant="flat">
            + Add dimension
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2 w-48">
          <Input
            size="sm"
            placeholder="Search…"
            value={search}
            onValueChange={setSearch}
            autoFocus
            className="mb-2"
          />
          {available.length === 0 ? (
            <p className="text-xs text-foreground/40 px-2 py-1">
              No dimensions available
            </p>
          ) : (
            <Listbox
              aria-label="Available dimensions"
              onAction={(key) => add(key as string)}
            >
              {available.map((d) => (
                <ListboxItem key={d.name}>{d.name}</ListboxItem>
              ))}
            </Listbox>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
