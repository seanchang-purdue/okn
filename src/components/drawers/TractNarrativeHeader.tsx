// src/components/drawers/TractNarrativeHeader.tsx
import React, { useMemo } from "react";
import type { CensusTractDemographic } from "../../types/demographic";
import { formatCensusTractId } from "../../utils/census";
import { formatCurrency } from "../../utils/format";

type TractNarrativeHeaderProps = {
  data: CensusTractDemographic;
};

const TractNarrativeHeader: React.FC<TractNarrativeHeaderProps> = ({
  data,
}) => {
  const { census_tract_info, income_summary } = data;

  const tags = useMemo(() => {
    const t: string[] = [];
    if (income_summary?.median_household_income != null) {
      const m = income_summary.median_household_income;
      if (m >= 150000) t.push("💰 High income");
      else if (m >= 80000) t.push("💵 Upper middle income");
      else if (m >= 50000) t.push("💵 Middle income");
      else t.push("💵 Lower income");
    }
    if (census_tract_info.median_age != null) {
      const a = census_tract_info.median_age;
      if (a < 30) t.push("🧑‍💼 Younger population");
      else if (a < 40) t.push("👤 Working-age majority");
      else t.push("👵 Older population");
    }
    if (income_summary?.poverty_rate != null) {
      const p = income_summary.poverty_rate;
      if (p >= 30) t.push("⚠️ High poverty");
      else if (p >= 15) t.push("⚠️ Moderate poverty");
      else t.push("✅ Low poverty");
    }
    return t.slice(0, 3);
  }, [income_summary, census_tract_info.median_age]);

  const sentence = useMemo(() => {
    const parts: string[] = [];
    // Income
    if (income_summary?.median_household_income != null) {
      parts.push(
        `Median HH income ${formatCurrency(income_summary.median_household_income)}`
      );
    }
    // Age
    if (census_tract_info.median_age != null) {
      parts.push(`median age ${census_tract_info.median_age}`);
    }
    // Population
    if (census_tract_info.total_population != null) {
      parts.push(
        `${census_tract_info.total_population.toLocaleString()} people`
      );
    }
    if (parts.length === 0) return "Demographic summary not available.";
    return parts.join(" · ");
  }, [income_summary, census_tract_info]);

  return (
    <div className="rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Census Tract
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatCensusTractId(census_tract_info.geoid)}
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        {sentence}
      </p>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="px-2 py-1 rounded-full text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TractNarrativeHeader;
