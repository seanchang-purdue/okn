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

export type FilterState = {
  dateRange?: [Date, Date];
  age?: number;
  sex?: "M" | "F";
  race?: "B" | "W" | "A" | "U";
  wound?: string;
  latino?: "Yes" | "No";
  fatal?: "Yes" | "No";
};
