export interface CityConfig {
  key: string;
  name: string;
  center: [number, number];
  zoom: number;
  sourceCity: string;
  aliases: string[];
}

export const CITIES: CityConfig[] = [
  {
    key: "philadelphia",
    name: "Philadelphia",
    center: [-75.1652, 39.9526],
    zoom: 11,
    sourceCity: "philadelphia",
    aliases: ["philly", "phila", "phl"],
  },
  {
    key: "chicago",
    name: "Chicago",
    center: [-87.6298, 41.8781],
    zoom: 11,
    sourceCity: "chicago",
    aliases: ["chi-town", "chitown"],
  },
  {
    key: "nyc",
    name: "New York City",
    center: [-74.006, 40.7128],
    zoom: 11,
    sourceCity: "nyc",
    aliases: ["nyc", "new york", "manhattan", "brooklyn", "bronx", "queens", "staten island"],
  },
  {
    key: "cincinnati",
    name: "Cincinnati",
    center: [-84.512, 39.1031],
    zoom: 12,
    sourceCity: "cincinnati",
    aliases: ["cincy", "cinci"],
  },
];

export const DEFAULT_CITY = CITIES[0]; // Philadelphia

export const getCityByKey = (key: string) => CITIES.find((c) => c.key === key);

const _phillyConfig = CITIES.find((c) => c.key === "philadelphia")!;
const PHILLY_NAMES = new Set([
  _phillyConfig.name.toLowerCase(),
  ..._phillyConfig.aliases,
]);

/**
 * Returns true if the city string is Philadelphia or any known alias.
 * Undefined / empty → treated as Philadelphia (the default city).
 */
export function isPhiladelphia(city: string | undefined): boolean {
  if (!city) return true;
  return PHILLY_NAMES.has(city.toLowerCase().trim());
}
