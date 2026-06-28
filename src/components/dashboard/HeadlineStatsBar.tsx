import type { DataMode } from "../../types/filters";
import { Card, CardContent } from "@/components/ui/card";

interface HeadlineStatsBarProps {
  data: GeoJSON.FeatureCollection | null;
  dataMode: DataMode;
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

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Card className="min-w-[120px] flex-1 gap-0 py-3">
    <CardContent className="px-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

const HeadlineStatsBar = ({ data, dataMode }: HeadlineStatsBarProps) => {
  const features = data?.features || [];
  const incidents = features.length;
  const fatalIncidents = features.filter(isFatal).length;
  const nonFatalIncidents = Math.max(0, incidents - fatalIncidents);
  const victimTotal = features.reduce((sum, feature) => sum + getVictimCount(feature), 0);

  const primaryLabel = dataMode === "victims" ? "Total Victims" : "Total Incidents";
  const primaryValue = dataMode === "victims" ? victimTotal : incidents;

  const fatalRate = incidents > 0 ? `${((fatalIncidents / incidents) * 100).toFixed(1)}%` : "0.0%";

  return (
    <div className="flex flex-wrap gap-3">
      <Stat label={primaryLabel} value={primaryValue.toLocaleString()} />
      <Stat label="Fatal Incidents" value={fatalIncidents.toLocaleString()} />
      <Stat label="Nonfatal Incidents" value={nonFatalIncidents.toLocaleString()} />
      <Stat label="Fatal Share" value={fatalRate} />
    </div>
  );
};

export default HeadlineStatsBar;
