declare module "@turf/turf" {
  export function polygon(coordinates: number[][][], properties?: any): any;
  export function point(coordinates: number[], properties?: any): any;
  export function booleanPointInPolygon(point: any, polygon: any): boolean;
}
