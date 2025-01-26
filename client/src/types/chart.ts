/*
 * This file contains the types for the data used in the application.
 */

export type LineChartDataType = {
  date: string;
  counts: number;
};

export type LineChartRawDataObject = {
  [key: string]: number;
};

export type DemographicChartDataType = {
  feature: string;
  counts: number;
};

export type DemographicChartRawDataObject = {
  [key: string]: number;
};
