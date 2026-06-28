// src/components/datacube/DimPicker.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>

      <div className="flex flex-wrap gap-1 min-h-[32px]">
        {selected.map((name) => (
          <Badge key={name} variant="default" className="gap-1 pr-1">
            {name}
            <button
              type="button"
              onClick={() => remove(name)}
              aria-label={`Remove ${name}`}
              className="rounded-full opacity-80 hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline">
            + Add dimension
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-2 w-48">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="mb-2 h-8"
          />
          {available.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-1">
              No dimensions available
            </p>
          ) : (
            <ul aria-label="Available dimensions" className="flex flex-col">
              {available.map((d) => (
                <li key={d.name}>
                  <button
                    type="button"
                    onClick={() => add(d.name)}
                    className="w-full rounded-sm px-2 py-1.5 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                  >
                    {d.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
