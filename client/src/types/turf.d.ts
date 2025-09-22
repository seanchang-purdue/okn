declare module "@turf/turf" {
  import type { Feature, Polygon, Point } from "geojson";
  export function polygon(
    coordinates: number[][][],
    properties?: Record<string, unknown>
  ): Feature<Polygon>;
  export function point(
    coordinates: number[],
    properties?: Record<string, unknown>
  ): Feature<Point>;
  export function booleanPointInPolygon(
    point: Feature<Point> | Point,
    polygon: Feature<Polygon> | Polygon
  ): boolean;
}
