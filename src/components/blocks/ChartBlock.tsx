"use client";

import { memo, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartBlockData, ChartKind } from "../../types/insight";
import InsightBlock from "./InsightBlock";

interface ChartBlockProps {
  data: ChartBlockData;
}

/**
 * Series palette derived from design tokens. Recharts accepts CSS custom
 * properties as stroke/fill values, so these stay theme-aware (light/dark).
 */
const PALETTE = [
  "var(--accent)",
  "var(--positive)",
  "var(--warn)",
  "var(--negative)",
  "color-mix(in srgb, var(--accent) 55%, var(--ink-3))",
  "color-mix(in srgb, var(--positive) 60%, var(--accent))",
  "color-mix(in srgb, var(--warn) 60%, var(--negative))",
  "color-mix(in srgb, var(--accent) 35%, var(--negative))",
];

const AXIS_COLOR = "var(--ink-3)";
const GRID_COLOR = "var(--line-1)";

const colorAt = (index: number) => PALETTE[index % PALETTE.length];

/** Coerce an unknown cell to a finite number, or null when not numeric. */
const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,%\s]/g, "");
    if (cleaned.length === 0) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

type Row = Record<string, unknown>;

interface BuiltChart {
  rows: Row[];
  xKey: string;
  series: string[];
}

/**
 * Build chart-ready row objects + the active series list from the trusted
 * backend table (columns + rows). Supports both wide-form (one column per
 * series via spec.yCols) and long-form (spec.seriesCol pivot).
 */
const buildChart = (data: ChartBlockData): BuiltChart => {
  const { columns, rows } = data.data;
  const { spec } = data;

  const objects: Row[] = rows.map((row) => {
    const obj: Row = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });

  const xKey = spec.xCol ?? columns[0] ?? "x";

  // Long-form: pivot rows by seriesCol into one column per distinct series.
  if (spec.seriesCol && columns.includes(spec.seriesCol)) {
    const valueCol = spec.yCols[0] ?? columns.find((c) => c !== xKey && c !== spec.seriesCol);
    const byX = new Map<string, Row>();
    const seriesSet = new Set<string>();

    objects.forEach((obj) => {
      const xVal = obj[xKey];
      const seriesName = String(obj[spec.seriesCol as string]);
      seriesSet.add(seriesName);
      const key = String(xVal);
      const bucket = byX.get(key) ?? { [xKey]: xVal };
      bucket[seriesName] =
        valueCol != null ? toNumber(obj[valueCol]) ?? obj[valueCol] : null;
      byX.set(key, bucket);
    });

    return {
      rows: Array.from(byX.values()),
      xKey,
      series: Array.from(seriesSet),
    };
  }

  // Wide-form: coerce each declared series column to a number.
  const series = spec.yCols.length > 0 ? spec.yCols : columns.filter((c) => c !== xKey);
  const normalized = objects.map((obj) => {
    const out: Row = { ...obj };
    series.forEach((key) => {
      const n = toNumber(obj[key]);
      if (n !== null) out[key] = n;
    });
    return out;
  });

  return { rows: normalized, xKey, series };
};

const TOOLTIP_STYLE = {
  backgroundColor: "var(--surface-1)",
  border: "1px solid var(--line-1)",
  borderRadius: 8,
  color: "var(--ink-1)",
  fontSize: 12,
  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.14)",
} as const;

const TOOLTIP_LABEL_STYLE = { color: "var(--ink-2)", fontWeight: 600 } as const;
const TOOLTIP_ITEM_STYLE = { color: "var(--ink-1)" } as const;

const AXIS_PROPS = {
  stroke: AXIS_COLOR,
  tick: { fill: AXIS_COLOR, fontSize: 11 },
  tickMargin: 8,
} as const;

const EmptyState = ({ title }: { title?: string }) => (
  <div className="flex h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-line-1 bg-surface-2/40 px-4 text-center">
    <p className="text-body font-medium text-ink-2">{title ?? "No chart data"}</p>
    <p className="mt-1 text-caption text-ink-3">
      The backend returned an empty dataset for this chart.
    </p>
  </div>
);

const ChartBlock = ({ data }: ChartBlockProps) => {
  const { spec } = data;
  const kind: ChartKind = spec.kind;

  const { rows, xKey, series } = useMemo(() => buildChart(data), [data]);

  // Legend-driven series visibility toggle.
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const toggleSeries = (key: string) =>
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }));

  const hasData = rows.length > 0 && series.length > 0;
  const title = spec.title;

  const legend = (
    <Legend
      onClick={(entry) => {
        const key = (entry as { dataKey?: string; value?: string }).dataKey
          ?? (entry as { value?: string }).value;
        if (typeof key === "string") toggleSeries(key);
      }}
      wrapperStyle={{ fontSize: 12, cursor: "pointer", paddingTop: 8 }}
      formatter={(value: string) => (
        <span style={{ color: hidden[value] ? "var(--ink-3)" : "var(--ink-2)" }}>
          {value}
        </span>
      )}
    />
  );

  const renderChart = () => {
    switch (kind) {
      case "bar":
        return (
          <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey={xKey} {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
            />
            {legend}
            {series.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                name={key}
                fill={colorAt(i)}
                radius={[3, 3, 0, 0]}
                stackId={spec.stacked ? "stack" : undefined}
                hide={hidden[key]}
              />
            ))}
          </BarChart>
        );

      case "line":
      case "multi_line":
        return (
          <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey={xKey} {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
            />
            {legend}
            {series.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={colorAt(i)}
                strokeWidth={2}
                dot={{ r: 2.5, fill: colorAt(i) }}
                activeDot={{ r: 5 }}
                hide={hidden[key]}
              />
            ))}
          </LineChart>
        );

      case "area":
        return (
          <AreaChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <defs>
              {series.map((key, i) => (
                <linearGradient key={key} id={`okn-area-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorAt(i)} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={colorAt(i)} stopOpacity={0.04} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey={xKey} {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
            />
            {legend}
            {series.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={colorAt(i)}
                strokeWidth={2}
                fill={`url(#okn-area-${i})`}
                stackId={spec.stacked ? "stack" : undefined}
                hide={hidden[key]}
              />
            ))}
          </AreaChart>
        );

      case "pie": {
        const valueKey = series[0];
        const pieRows = rows.filter((r) => toNumber(r[valueKey]) !== null);
        return (
          <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
            />
            {legend}
            <Pie
              data={pieRows}
              dataKey={valueKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius="78%"
              innerRadius="48%"
              paddingAngle={2}
              stroke="var(--surface-1)"
              strokeWidth={2}
            >
              {pieRows.map((row, i) => (
                <Cell key={`${String(row[xKey])}-${i}`} fill={colorAt(i)} />
              ))}
            </Pie>
          </PieChart>
        );
      }

      case "scatter":
        return (
          <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey={xKey} type="number" name={xKey} {...AXIS_PROPS} />
            <YAxis dataKey={series[0]} type="number" name={series[0]} {...AXIS_PROPS} />
            <ZAxis range={[40, 40]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "var(--line-2)" }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
            />
            {series.length > 1 && legend}
            {series.map((key, i) => (
              <Scatter
                key={key}
                name={key}
                data={rows}
                dataKey={key}
                fill={colorAt(i)}
                hide={hidden[key]}
              />
            ))}
          </ScatterChart>
        );

      default:
        return <EmptyState title={title} />;
    }
  };

  return (
    <InsightBlock title={title}>
      {hasData ? (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState title={title} />
      )}

      {data.caption && (
        <p className="mt-2 text-caption text-ink-3">{data.caption}</p>
      )}
    </InsightBlock>
  );
};

export default memo(ChartBlock);
