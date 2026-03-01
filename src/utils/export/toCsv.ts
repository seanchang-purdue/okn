import type { Map as MapboxMap } from "mapbox-gl";

export interface CsvBuildResult {
  csv: string;
  rowCount: number;
}

const normalizeCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
};

const escapeCsvCell = (value: string): string => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const getFeatureCollectionFromMap = (
  map: MapboxMap | null,
  sourceId = "shooting"
): GeoJSON.FeatureCollection | null => {
  if (!map) return null;
  const source = map.getSource(sourceId) as unknown as {
    _data?: GeoJSON.FeatureCollection;
  } | null;

  if (!source || !source._data || !Array.isArray(source._data.features)) {
    return null;
  }

  return source._data;
};

const featureToRow = (
  feature: GeoJSON.Feature,
  index: number
): Record<string, string> => {
  const row: Record<string, string> = {
    row_index: String(index + 1),
    feature_id: feature.id !== undefined ? String(feature.id) : "",
    geometry_type: feature.geometry?.type || "",
  };

  if (feature.geometry?.type === "Point") {
    const coordinates = feature.geometry.coordinates as [number, number];
    row.longitude = String(coordinates[0]);
    row.latitude = String(coordinates[1]);
  }

  const props = (feature.properties || {}) as Record<string, unknown>;
  Object.entries(props).forEach(([key, value]) => {
    row[key] = normalizeCell(value);
  });

  return row;
};

const buildHeaders = (rows: Array<Record<string, string>>): string[] => {
  const fixedHeaders = [
    "row_index",
    "feature_id",
    "geometry_type",
    "longitude",
    "latitude",
  ];

  const dynamicSet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!fixedHeaders.includes(key)) dynamicSet.add(key);
    });
  });

  const dynamicHeaders = Array.from(dynamicSet).sort();
  return [...fixedHeaders, ...dynamicHeaders];
};

export const buildCsvFromFeatureCollection = (
  featureCollection: GeoJSON.FeatureCollection
): CsvBuildResult => {
  const features = featureCollection.features || [];
  const rows = features.map(featureToRow);
  const headers = buildHeaders(rows);

  const headerLine = headers.map(escapeCsvCell).join(",");
  const valueLines = rows.map((row) =>
    headers.map((header) => escapeCsvCell(row[header] || "")).join(",")
  );

  return {
    csv: [headerLine, ...valueLines].join("\n"),
    rowCount: rows.length,
  };
};

export const downloadTextFile = (
  content: string,
  filename: string,
  mimeType: string
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getExportFeatureCollection = (
  map: MapboxMap | null,
  directData?: GeoJSON.FeatureCollection | null
): GeoJSON.FeatureCollection | null => {
  if (directData && Array.isArray(directData.features) && directData.features.length > 0) {
    return directData;
  }

  return getFeatureCollectionFromMap(map);
};
