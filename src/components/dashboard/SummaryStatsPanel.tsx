interface SummaryStatsPanelProps {
  data: GeoJSON.FeatureCollection | null;
}

const toRecord = (feature: GeoJSON.Feature): Record<string, unknown> => {
  const props = feature.properties;
  if (!props || typeof props !== "object") return {};
  return props as Record<string, unknown>;
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

const getCensusTract = (feature: GeoJSON.Feature): string | null => {
  const props = toRecord(feature);
  const tract =
    (props.census_tract as string | number | undefined) ||
    (props.geoid as string | number | undefined);
  if (tract === undefined || tract === null) return null;
  const normalized = String(tract).trim();
  return normalized || null;
};

const getTopTract = (features: GeoJSON.Feature[]): string => {
  const counts = new Map<string, number>();

  features.forEach((feature) => {
    const tract = getCensusTract(feature);
    if (!tract) return;
    counts.set(tract, (counts.get(tract) || 0) + 1);
  });

  let top = "--";
  let max = 0;
  counts.forEach((count, tract) => {
    if (count > max) {
      max = count;
      top = tract;
    }
  });

  return top;
};

const formatDate = (date: Date | null): string => {
  if (!date) return "--";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const SummaryStatsPanel = ({ data }: SummaryStatsPanelProps) => {
  const features = data?.features || [];

  const dates = features
    .map(toDate)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  const firstDate = dates[0] || null;
  const lastDate = dates[dates.length - 1] || null;

  const tractSet = new Set(
    features
      .map(getCensusTract)
      .filter((tract): tract is string => typeof tract === "string")
  );

  const monthSpan =
    firstDate && lastDate
      ? Math.max(
          1,
          (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
            (lastDate.getMonth() - firstDate.getMonth()) +
            1
        )
      : 1;

  const avgPerMonth = features.length > 0 ? features.length / monthSpan : 0;

  const stats = [
    {
      label: "Date Range",
      value: `${formatDate(firstDate)} - ${formatDate(lastDate)}`,
    },
    {
      label: "Unique Tracts",
      value: tractSet.size.toLocaleString(),
    },
    {
      label: "Avg / Month",
      value: avgPerMonth.toFixed(1),
    },
    {
      label: "Top Tract",
      value: getTopTract(features),
    },
  ];

  return (
    <section className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-panel)] p-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--chat-muted)]">
        Summary
      </p>
      <div className="mt-2 grid grid-cols-1 gap-2">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[var(--chat-border)] bg-white/80 px-3 py-2 dark:bg-slate-900/70"
          >
            <p className="text-[10px] uppercase tracking-[0.05em] text-[var(--chat-muted)]">{item.label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--chat-title)] dark:text-slate-100">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SummaryStatsPanel;
