// src/types/census.ts

/**
 * Census tract basic information
 */
export interface CensusTractInfo {
  id: number;
  geoid: string;
  /** Optional numeric tract identifier (11-digit FIPS) */
  tract_id?: number;
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
  /**
   * Income summary for the tract (ACS 2022). May be null if not available.
   */
  income_summary?: IncomeSummary | null;
  /**
   * Income distribution by bracket for the tract (sorted by sort_order ascending).
   */
  income_distribution?: IncomeDistributionItem[];
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

/**
 * Income summary (ACS) for a census tract
 */
export interface IncomeSummary {
  year: number;
  median_household_income: number | null;
  per_capita_income: number | null;
  households_total: number | null;
  poverty_universe: number | null;
  poverty_below: number | null;
  /** Percentage value, e.g., 23.45 means 23.45% */
  poverty_rate: number | null;
}

/**
 * Income distribution record for a census tract (single year)
 */
export interface IncomeDistributionItem {
  income_bracket_id: number;
  households: number | null;
  /** Percentage value, e.g., 12.5 means 12.5% */
  pct_households: number | null;
  bracket_name: string;
  min_income: number | null;
  max_income: number | null;
  sort_order: number;
}
