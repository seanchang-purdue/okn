import type { FeatureCollection, Feature, Point } from "geojson";
import type { ResourceProperties } from "../types/communityResources";

const sampleFeatures: Feature<Point, ResourceProperties>[] = [
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-75.163526, 39.952335],
    },
    properties: {
      id: 1,
      name: "Center City Community Kitchen",
      type: "food",
      category: "Food Assistance",
      address: "123 Market St, Philadelphia, PA",
      phone: "(215) 555-1234",
      availability: "available",
      is24hour: false,
      cost: "Free",
      rating: 4.5,
      zipcode: "19106",
    },
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-75.165222, 39.959722],
    },
    properties: {
      id: 2,
      name: "Broad Street Shelter",
      type: "shelter",
      category: "Emergency Housing",
      address: "400 N Broad St, Philadelphia, PA",
      phone: "(215) 555-9876",
      availability: "available",
      is24hour: true,
      cost: "Free",
      rating: 4.1,
      zipcode: "19130",
    },
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-75.145857, 39.948889],
    },
    properties: {
      id: 3,
      name: "Delaware River Counseling",
      type: "mental_health",
      category: "Mental Health Services",
      address: "50 Columbus Blvd, Philadelphia, PA",
      phone: "(215) 555-2468",
      availability: "available",
      is24hour: false,
      cost: "Sliding scale",
      rating: 4.7,
      zipcode: "19106",
    },
  },
];

const communityResourcesFallback: FeatureCollection<
  Point,
  ResourceProperties
> = {
  type: "FeatureCollection",
  features: sampleFeatures,
};

export default communityResourcesFallback;
