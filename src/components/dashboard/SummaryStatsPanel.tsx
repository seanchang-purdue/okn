import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 px-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-border bg-muted/40 px-3 py-2"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SummaryStatsPanel;
