// src/types/income.ts

/**
 * Income bracket metadata as defined by the Census (B19001 series)
 */
export interface IncomeBracket {
  income_bracket_id: number;
  code: string;
  name: string;
  min_income: number | null;
  max_income: number | null;
  sort_order: number;
}

/**
 * Income summary record for a tract and year
 */
export interface IncomeSummaryRecord {
  tract_id: number;
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
 * Income distribution record for a tract, year, and bracket
 */
export interface IncomeDistributionRecord {
  tract_id: number;
  year: number;
  income_bracket_id: number;
  households: number | null;
  /** Percentage value, e.g., 12.5 means 12.5% */
  pct_households: number | null;
  income_bracket: IncomeBracket | null;
}

/**
 * Dedicated income endpoint response payload
 */
export interface CensusTractIncomeResponse {
  tract_id: number;
  geoid: string;
  income_summary: IncomeSummaryRecord[];
  income_distribution: IncomeDistributionRecord[];
}

/**
 * Tracts with incident counts and income summary
 */
export interface CensusTractWithIncidents {
  id: number;
  tract_id: number;
  state_fips: string;
  county_fips: string;
  tract_code: string;
  total_population: number | null;
  incident_count: number;
  income_year: number | null;
  median_household_income: number | null;
  per_capita_income: number | null;
  households_total: number | null;
  poverty_universe: number | null;
  poverty_below: number | null;
  /** Percentage value, e.g., 30 means 30% */
  poverty_rate: number | null;
}
