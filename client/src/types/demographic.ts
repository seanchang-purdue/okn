// src/types/census.ts

/**
 * Census tract basic information
 */
export interface CensusTractInfo {
  id: number;
  geoid: string;
  total_population: number;
  median_age: number;
  sex_ratio: number;
  age_dependency_ratio: number;
}

/**
 * Gender distribution data
 */
export interface GenderDistribution {
  male: number;
  female: number;
}

/**
 * Age groups summary
 */
export interface AgeGroups {
  children: number;
  adults: number;
  seniors: number;
}

/**
 * Age distribution data point
 */
export interface AgeDataPoint {
  age_group: string;
  percentage: number;
  count: number;
}

/**
 * Age distribution by gender
 */
export interface AgeDistribution {
  Male: AgeDataPoint[];
  Female: AgeDataPoint[];
  Total: AgeDataPoint[];
}

/**
 * Race distribution data
 * Keys are race names, values are population counts
 */
export interface RaceDistribution {
  [race: string]: number;
}

/**
 * Complete demographic data for a census tract
 */
export interface CensusTractDemographic {
  census_tract_info: CensusTractInfo;
  gender_distribution: GenderDistribution;
  age_groups: AgeGroups;
  age_distribution: AgeDistribution;
  race_distribution: RaceDistribution;
}

/**
 * Simplified census tract data for listings
 */
export interface CensusTractListItem {
  id: number;
  geoid: string;
  total_population: number;
  male_population: number;
  female_population: number;
}

/**
 * Census tract data for visualization
 */
export interface CensusTractVisualization {
  census_tract_info: {
    id: number;
    geoid: string;
    total_population: number;
  };
  gender_distribution: {
    labels: string[];
    data: number[];
  };
  age_distribution: {
    labels: string[];
    data: number[];
  };
  race_distribution: {
    labels: string[];
    data: number[];
  };
}

/**
 * Census tract comparison data
 */
export interface CensusTractComparison {
  geoids: string[];
  tracts: Array<{
    geoid: string;
    total_population: number;
    median_age: number;
    gender_ratio: number;
    age_groups: AgeGroups;
    top_races: Record<string, number>;
  }>;
}
