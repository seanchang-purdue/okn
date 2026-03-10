// src/components/datacube/ChartTypeSelector.tsx
"use client";

import type { DisplayMode } from "../../types/datacube";

interface Props {
  current: DisplayMode;
  autoDetected: DisplayMode;
  locked: boolean;
  onChange: (mode: DisplayMode) => void;
}

const MODES: { value: DisplayMode; label: string }[] = [
  { value: "table", label: "Table" },
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
];

export default function ChartTypeSelector({
  current,
  autoDetected,
  locked,
  onChange,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg border border-default-200 overflow-hidden">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={[
              "px-3 py-1 text-sm transition-colors",
              current === value
                ? "bg-primary text-primary-foreground"
                : "bg-content1 text-foreground hover:bg-content2",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
      {!locked && (
        <span className="text-xs text-foreground/40">
          Auto: {autoDetected === "line" ? "Line" : "Bar"}
        </span>
      )}
    </div>
  );
}
