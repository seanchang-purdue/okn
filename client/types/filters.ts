// types/filters.ts

export const filterList = [
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
