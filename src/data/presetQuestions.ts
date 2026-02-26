export type PresetQuestion = {
  title: string;
  question: string;
  icon: string;
  category: string;
};

// 35 curated questions leveraging incidents, demographics, income/poverty data
export const PRESET_QUESTION_BANK: PresetQuestion[] = [
  // === OVERVIEW (Basic Incident Statistics) ===
  {
    title: "Total Incidents",
    icon: "📊",
    category: "Overview",
    question:
      "How many shooting incidents occurred in the selected date range?",
  },
  {
    title: "Incident Trend",
    icon: "📊",
    category: "Overview",
    question:
      "Show incident counts over time and highlight any notable shifts.",
  },
  {
    title: "Recent 30 Days",
    icon: "🔁",
    category: "Overview",
    question:
      "Compare the last 30 days to the previous 30 days for incident counts.",
  },
  {
    title: "Year-over-Year",
    icon: "📅",
    category: "Overview",
    question:
      "Compare incidents year-to-date with the same period last year.",
  },
  {
    title: "Monthly Trend",
    icon: "📈",
    category: "Overview",
    question:
      "Show monthly incident counts for the last three years and identify seasonal peaks.",
  },

  // === TIME PATTERNS ===
  {
    title: "Hour of Day",
    icon: "🕑",
    category: "Time",
    question:
      "Show incidents by hour of day. Which hours have the most shootings?",
  },
  {
    title: "Late Night Hours",
    icon: "🌙",
    category: "Time",
    question:
      "How many incidents occurred between 10 PM and 2 AM, and what share of the day’s incidents did this represent?",
  },
  {
    title: "Weekday vs Weekend",
    icon: "🗓️",
    category: "Time",
    question:
      "Compare weekday vs weekend incident counts.",
  },
  {
    title: "Summer vs Winter",
    icon: "🌤️",
    category: "Time",
    question:
      "Compare summer (Jun-Aug) vs winter (Dec-Feb) incident patterns.",
  },

  // === LOCATION / HOTSPOTS ===
  {
    title: "Top 10 Tracts",
    icon: "🗺️",
    category: "Place",
    question:
      "Which 10 census tracts have the highest incident counts in the selected date range?",
  },
  {
    title: "Hotspot Concentration",
    icon: "🥧",
    category: "Place",
    question:
      "What percentage of total incidents occur in the top 5 census tracts?",
  },
  {
    title: "Persistent Hotspots",
    icon: "📌",
    category: "Place",
    question:
      "Which census tracts have remained in the top 10 for incidents consistently over multiple years?",
  },
  {
    title: "Emerging Hotspots",
    icon: "📍",
    category: "Place",
    question:
      "Which census tracts showed the largest year-over-year increase in incidents?",
  },
  {
    title: "Top 20 by Count",
    icon: "🚨",
    category: "Place",
    question:
      "Which census tracts have the highest incident counts (top 20) in the selected period?",
  },

  // === DEMOGRAPHICS (Incident Victims) ===
  {
    title: "Age Distribution",
    icon: "🎂",
    category: "Demographics",
    question:
      "Show the age distribution of shooting victims. Which age groups are most affected?",
  },
  {
    title: "Youth Victims",
    icon: "👶",
    category: "Demographics",
    question:
      "How many victims were under age 20, and what share of incidents does this represent?",
  },
  {
    title: "Race Distribution",
    icon: "👥",
    category: "Demographics",
    question:
      "Break down incidents by victim race. Which racial groups are most represented?",
  },
  {
    title: "Sex Distribution",
    icon: "👫",
    category: "Demographics",
    question: "What percentage of shooting victims were male vs female?",
  },
  {
    title: "Incidents by Age Group",
    icon: "⏱️",
    category: "Demographics",
    question:
      "Compare incident counts across age groups. Which age groups are most affected?",
  },

  // === INCOME & POVERTY CONTEXT (Enhanced Section) ===
  {
    title: "Income Tiers",
    icon: "💵",
    category: "Income",
    question:
      "Compare incident counts across census tracts grouped by median household income: <$30K, $30-60K, $60-100K, >$100K.",
  },
  {
    title: "Poverty Correlation",
    icon: "🪙",
    category: "Income",
    question:
      "Group census tracts by poverty rate (0-10%, 10-20%, 20-30%, >30%) and show incident counts for each group.",
  },
  {
    title: "Hotspot Economics",
    icon: "💰",
    category: "Income",
    question:
      "For the top 10 census tracts by incidents, what are their median household incomes and poverty rates?",
  },
  {
    title: "Low-Income Incident Rates",
    icon: "📉",
    category: "Income",
    question:
      "In census tracts with median household income below $30K, how do incident counts compare to tracts above $100K?",
  },
  {
    title: "Income Inequality",
    icon: "📊",
    category: "Income",
    question:
      "Compare incident counts between the lowest income quartile and highest income quartile census tracts.",
  },
  {
    title: "Wealth Distribution",
    icon: "💸",
    category: "Income",
    question:
      "For the top 20 high-incident tracts, show the household wealth distribution.",
  },
  {
    title: "Poverty Extremes",
    icon: "💔",
    category: "Income",
    question:
      "Compare incident counts and victim demographics between tracts with poverty rates above 30% vs below 10%.",
  },
  {
    title: "High Poverty Hotspots",
    icon: "⚠️",
    category: "Income",
    question:
      "Show the top 20 census tracts with poverty rates above 20%, ordered by total incidents.",
  },
  {
    title: "Income & Time Patterns",
    icon: "🕐",
    category: "Income",
    question:
      "Compare hour-of-day incident patterns between low-income tracts (<$30K median) vs high-income tracts (>$80K median).",
  },
  {
    title: "Poverty & Incident Rates",
    icon: "⚖️",
    category: "Income",
    question:
      "Is there a relationship between tract poverty rates and incident counts? Summarize by poverty quartile.",
  },
  {
    title: "Income Mix (Single Tract)",
    icon: "🔍",
    category: "Income",
    question:
      "For the highest-incident census tract, summarize the household wealth mix (low, middle, high) and include the median household income.",
  },

  // === CITY COMPARISONS ===
  {
    title: "Chicago vs Philadelphia",
    icon: "🏙️",
    category: "Comparison",
    question:
      "Compare total incidents and trends between Chicago and Philadelphia over the last 3 years.",
  },
  {
    title: "City Demographics",
    icon: "🧑‍🤝‍🧑",
    category: "Comparison",
    question:
      "Compare victim demographics (age, race, sex) between Chicago and Philadelphia shootings.",
  },
  {
    title: "City Income Context",
    icon: "💰",
    category: "Comparison",
    question:
      "Compare the median household income and poverty rates for high-incident census tracts in Chicago vs Philadelphia.",
  },
  {
    title: "Time Patterns by City",
    icon: "🕐",
    category: "Comparison",
    question:
      "Compare hour-of-day and day-of-week incident patterns between Chicago and Philadelphia.",
  },

  // === COMMUNITY RESOURCES ===
  {
    title: "Resources Overview",
    icon: "🏥",
    category: "Resources",
    question:
      "How many community resources (food, shelter, mental health) are available in Philadelphia?",
  },
  {
    title: "Food Resources",
    icon: "🍽️",
    category: "Resources",
    question:
      "Where are the food pantries and feeding programs located? Show me the top 10 food resources in high-incident areas.",
  },
  {
    title: "Emergency Shelters",
    icon: "🏠",
    category: "Resources",
    question:
      "Where are emergency shelters located in Philadelphia? Which ones offer 24/7 service?",
  },
  {
    title: "Mental Health Services",
    icon: "🧠",
    category: "Resources",
    question:
      "Where can people access mental health services in Philadelphia? Which ones are free?",
  },
  {
    title: "Resources in Hotspots",
    icon: "📍",
    category: "Resources",
    question:
      "For the top 10 census tracts with highest shooting incidents, how many community resources are nearby within 1 mile?",
  },
  {
    title: "Resource Gaps",
    icon: "❌",
    category: "Resources",
    question:
      "Which high-incident census tracts have the fewest community resources within walking distance?",
  },
  {
    title: "24/7 Resources",
    icon: "⏰",
    category: "Resources",
    question:
      "Which community resources offer 24/7 service, and where are they located?",
  },
  {
    title: "Free Resources",
    icon: "💚",
    category: "Resources",
    question:
      "Show me all free community resources (no cost) available in Philadelphia.",
  },
  {
    title: "Resource Accessibility",
    icon: "🚶",
    category: "Resources",
    question:
      "In high-poverty areas (poverty rate >30%), how many community resources are available within a 0.5 mile radius?",
  },
  {
    title: "Resource Distribution",
    icon: "🗺️",
    category: "Resources",
    question:
      "Compare the distribution of community resources across low-income vs high-income census tracts.",
  },
];
