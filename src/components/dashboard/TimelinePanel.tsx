import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DataMode, IntervalMode } from "../../types/filters";

interface TimelinePanelProps {
  data: GeoJSON.FeatureCollection | null;
  dataMode: DataMode;
  interval: IntervalMode;
}

interface Point {
  bucket: string;
  value: number;
}

const toRecord = (feature: GeoJSON.Feature): Record<string, unknown> => {
  const props = feature.properties;
  if (!props || typeof props !== "object") return {};
  return props as Record<string, unknown>;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const isFatal = (feature: GeoJSON.Feature): boolean => {
  const props = toRecord(feature);
  const normalized = String(props.fatal ?? "").trim().toLowerCase();
  return ["1", "1.0", "true", "yes", "y"].includes(normalized);
};

const getVictimCount = (feature: GeoJSON.Feature): number => {
  const props = toRecord(feature);
  const killed = toNumber(props.n_killed ?? props.killed ?? (isFatal(feature) ? 1 : 0));
  const injured = toNumber(props.n_injured ?? props.injured ?? 0);
  const total = killed + injured;
  return total > 0 ? total : 1;
};

const toDate = (feature: GeoJSON.Feature): Date | null => {
  const props = toRecord(feature);
  const raw =
    (props.datetime as string | undefined) ||
    (props.date as string | undefined) ||
    (props.occurred_at as string | undefined);

  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const toBucketKey = (date: Date, interval: IntervalMode) => {
  const year = date.getFullYear();
  if (interval === "yearly") return String(year);

  if (interval === "quarterly") {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${year}-Q${quarter}`;
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatBucketLabel = (bucket: string, interval: IntervalMode) => {
  if (interval === "yearly") return bucket;

  if (interval === "quarterly") {
    const match = bucket.match(/^(\d{4})-Q([1-4])$/);
    if (match) return `Q${match[2]} ${match[1]}`;
    return bucket;
  }

  const match = bucket.match(/^(\d{4})-(\d{2})$/);
  if (!match) return bucket;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const sortBucket = (a: string, b: string, interval: IntervalMode) => {
  if (interval === "yearly") return Number(a) - Number(b);

  if (interval === "quarterly") {
    const parse = (key: string) => {
      const match = key.match(/^(\d{4})-Q([1-4])$/);
      if (!match) return 0;
      return Number(match[1]) * 10 + Number(match[2]);
    };
    return parse(a) - parse(b);
  }

  return a.localeCompare(b);
};

const buildSeries = (
  data: GeoJSON.FeatureCollection,
  interval: IntervalMode,
  dataMode: DataMode
): Point[] => {
  const buckets = new Map<string, number>();

  data.features.forEach((feature) => {
    const date = toDate(feature);
    if (!date) return;

    const bucket = toBucketKey(date, interval);
    const increment = dataMode === "victims" ? getVictimCount(feature) : 1;

    buckets.set(bucket, (buckets.get(bucket) || 0) + increment);
  });

  return Array.from(buckets.entries())
    .sort((a, b) => sortBucket(a[0], b[0], interval))
    .map(([bucket, value]) => ({ bucket, value }));
};

const TimelinePanel = ({ data, dataMode, interval }: TimelinePanelProps) => {
  const points = data ? buildSeries(data, interval, dataMode) : [];

  return (
    <section className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-panel)] p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--chat-muted)]">
          Timeline
        </p>
        <p className="text-[11px] text-[var(--chat-muted)]">
          {interval} · {dataMode}
        </p>
      </div>

      {points.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs text-[var(--chat-muted)]">
          No time-series data available.
        </div>
      ) : (
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ left: 6, right: 6, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => formatBucketLabel(String(value), interval)}
              />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                formatter={(value) => {
                  const numericValue = typeof value === "number" ? value : 0;
                  return [
                    numericValue,
                    dataMode === "victims" ? "Victims" : "Incidents",
                  ];
                }}
                labelFormatter={(label) => formatBucketLabel(String(label), interval)}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chat-accent)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

export default TimelinePanel;
