// types/filters.ts
export type FilterOption = {
  key: string;
  label: string;
  options?: string[];
};

export const filterList: FilterOption[] = [
  { key: "age", label: "Age" },
  { key: "sex", label: "Sex", options: ["M", "F"] },
  { key: "race", label: "Race", options: ["B", "W", "A", "U"] },
  {
    key: "wound",
    label: "Wound",
    options: [
      "Multiple",
      "Chest",
      "Arm",
      "Leg",
      "Head",
      "Buttocks",
      "Abdomen",
      "Groin",
      "Shoulder",
      "Hip",
      "Foot",
      "Ankel",
      "Neck",
      "Unknown",
    ],
  },
  { key: "latino", label: "Latino", options: ["Yes", "No"] },
  { key: "fatal", label: "Fatal", options: ["Yes", "No"] },
];

export type FilterKey = (typeof filterList)[number]["key"];

export type VictimMode = "all" | "fatal" | "nonfatal";
export type DataMode = "victims" | "incidents";
export type IntervalMode = "monthly" | "quarterly" | "yearly";

export type FilterState = {
  dateRange?: [Date, Date];
  age?: number | number[];
  sex?: "M" | "F" | Array<"M" | "F">;
  race?: "B" | "W" | "A" | "U" | Array<"B" | "W" | "A" | "U">;
  wound?: string | string[];
  latino?: "Yes" | "No" | Array<"Yes" | "No">;
  fatal?: "Yes" | "No" | Array<"Yes" | "No">;

  // Atlas-aligned fields introduced in phase planning
  city?: string;
  victimMode?: VictimMode;
  minKilled?: number;
  minInjured?: number;
  dataMode?: DataMode;
  interval?: IntervalMode;
  geography?: string;
  geographyType?: string;
  incidentTaxonomy?: string[];
};
