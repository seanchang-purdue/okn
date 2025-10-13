// src/components/drawers/TractInsightModal.tsx
import React, { useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Spinner,
} from "@heroui/react";
import type { CensusTractDemographic } from "../../types/demographic";
import { formatCensusTractId } from "../../utils/census";
import {
  formatCurrency,
  formatPercentage,
  formatInteger,
} from "../../utils/format";
import ChartCard from "../charts/ChartCard";
import KpiCard from "../charts/KpiCard";
import AgeMixDonut from "../charts/AgeMixDonut";
import RaceStackedBar100 from "../charts/RaceStackedBar100";
import IncomeHistogram from "../charts/IncomeHistogram";
import GenderDistributionChart from "../charts/GenderDistributionChart";
import AgeDistributionChart from "../charts/AgeDistributionChart";
import IncomeBucketBar from "../charts/IncomeBucketBar";
import AgeCohortBars from "../charts/AgeCohortBars";

type TractInsightModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: CensusTractDemographic | null;
  loading?: boolean;
  benchmarks?: {
    cityMedianIncome?: number | null;
    cityMedianAge?: number | null;
    cityPovertyRate?: number | null;
  };
};

const TractInsightModal: React.FC<TractInsightModalProps> = ({
  isOpen,
  onOpenChange,
  data,
  loading = false,
  benchmarks,
}) => {
  const [tab, setTab] = useState<"overview" | "age" | "race" | "income">(
    "overview"
  );

  const subtitle = useMemo(() => {
    if (!data) return "";
    const pop = data.census_tract_info.total_population?.toLocaleString();
    const age = data.census_tract_info.median_age;
    const pov = data.income_summary?.poverty_rate;
    const parts: string[] = [];
    if (pop) parts.push(`${pop} people`);
    if (age != null) parts.push(`median age ${age}`);
    if (pov != null) parts.push(`poverty ${pov.toFixed(1)}%`);
    return parts.join(" · ");
  }, [data]);

  // Minimal, clean tab bar with keyboard support
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "age", label: "Age & Gender" },
    { key: "race", label: "Race" },
    { key: "income", label: "Income" },
  ] as const;

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const idx = tabs.findIndex((t) => t.key === tab);
    const next =
      e.key === "ArrowRight"
        ? (idx + 1) % tabs.length
        : (idx - 1 + tabs.length) % tabs.length;
    setTab(tabs[next].key);
  };

  // Helper: check pyramid data validity
  const hasPyramid = !!(
    data &&
    data.age_distribution &&
    ((data.age_distribution.Male?.length ?? 0) > 0 ||
      (data.age_distribution.Female?.length ?? 0) > 0)
  );

  // Build a richer summary for overview
  const overviewSummary = useMemo(() => {
    if (!data) return "";
    const info = data.census_tract_info;
    const income = data.income_summary;
    const race = data.race_distribution;
    const pop = info.total_population?.toLocaleString();
    const age = info.median_age != null ? `${info.median_age}` : "N/A";
    const pov =
      income?.poverty_rate != null
        ? `${income.poverty_rate.toFixed(1)}%`
        : "N/A";
    const incomeTxt =
      income?.median_household_income != null
        ? `${formatCurrency(income.median_household_income)}`
        : "N/A";
    // Top race
    const entries = Object.entries(race || {});
    let topRace = "";
    if (entries.length) {
      const total = Math.max(
        1,
        entries.reduce((s, [, c]) => s + c, 0)
      );
      const sorted = entries.sort((a, b) => b[1] - a[1]);
      const [name, count] = sorted[0];
      const pct = ((count / total) * 100).toFixed(1);
      topRace = `${name} (${pct}%)`;
    }
    // Sex ratio and dependency ratio (coerce strings to numbers if needed)
    const sexRatioRaw: number | string | undefined =
      info.sex_ratio as unknown as number | string | undefined;
    const sexRatioNum =
      typeof sexRatioRaw === "string" ? Number(sexRatioRaw) : sexRatioRaw;
    const depRaw: number | string | undefined =
      info.age_dependency_ratio as unknown as number | string | undefined;
    const depNum = typeof depRaw === "string" ? Number(depRaw) : depRaw;
    const parts = [
      pop ? `${pop} people` : undefined,
      `median age ${age}`,
      `poverty ${pov}`,
      `median income ${incomeTxt}`,
      topRace ? `largest group: ${topRace}` : undefined,
      sexRatioNum != null && !Number.isNaN(sexRatioNum)
        ? `sex ratio ${sexRatioNum.toFixed(1)}`
        : undefined,
      depNum != null && !Number.isNaN(depNum)
        ? `dependency ${depNum.toFixed(1)}%`
        : undefined,
    ].filter(Boolean);
    return parts.join(" · ");
  }, [data]);

  // Narrative headline and persona summary
  const { headline, persona, tags, comparative } = useMemo(() => {
    const result = {
      headline: "",
      persona: "",
      tags: [] as string[],
      comparative: "",
    };
    if (!data) return result;
    const info = data.census_tract_info;
    const income = data.income_summary;
    const total = Math.max(1, info.total_population || 0);
    const childrenPct = ((data.age_groups.children || 0) / total) * 100;
    const seniorsPct = ((data.age_groups.seniors || 0) / total) * 100;
    // adultsPct not used in narrative; omitted to satisfy lint
    const poverty = income?.poverty_rate ?? null;
    const medIncome = income?.median_household_income ?? null;

    // Headline logic
    const agePhrase =
      info.median_age != null && info.median_age < 33
        ? "a younger working population"
        : info.median_age != null && info.median_age >= 40
          ? "an older population"
          : "a working-age majority";
    const povPhrase =
      poverty != null && poverty >= 40
        ? "with very high poverty"
        : poverty != null && poverty >= 20
          ? "with elevated poverty"
          : poverty != null
            ? "with relatively low poverty"
            : "";
    result.headline = `This tract has ${agePhrase}${povPhrase ? ", " + povPhrase : ""}.`;

    // Persona summary
    if (childrenPct >= 30 && seniorsPct < 12) {
      result.persona = "Predominantly working-age families with few seniors.";
    } else if (seniorsPct >= 18) {
      result.persona = "Aging community with a stable base.";
    } else {
      result.persona = "Balanced age profile with working-age majority.";
    }

    // Tags
    if (info.median_age != null && info.median_age < 33)
      result.tags.push("Younger workforce");
    if (poverty != null && poverty > 40) result.tags.push("High poverty");
    if (childrenPct > 30) result.tags.push("Family-heavy");
    // Diversity index (Herfindahl) -> 1 - sum(p_i^2)
    const entries = Object.entries(data.race_distribution || {});
    if (entries.length) {
      const tot = Math.max(
        1,
        entries.reduce((s, [, c]) => s + c, 0)
      );
      const h = entries.reduce((s, [, c]) => {
        const p = (c as number) / tot;
        return s + p * p;
      }, 0);
      const diversity = 1 - h; // 0..~1
      if (diversity > 0.6) result.tags.push("High diversity");
    }
    if (medIncome != null && medIncome < 30000)
      result.tags.push("Low income concentration");

    // Comparative context (if benchmarks provided)
    if (benchmarks?.cityMedianIncome != null && medIncome != null) {
      const rel = medIncome / Math.max(1, benchmarks.cityMedianIncome);
      const delta = Math.round((1 - rel) * 100);
      if (delta >= 5) {
        result.comparative = `Median income here (${formatCurrency(medIncome)}) is ${delta}% lower than the city median (${formatCurrency(benchmarks.cityMedianIncome)}).`;
      } else if (delta <= -5) {
        result.comparative = `Median income here (${formatCurrency(medIncome)}) is ${Math.abs(delta)}% higher than the city median (${formatCurrency(benchmarks.cityMedianIncome)}).`;
      }
    }
    return result;
  }, [data, benchmarks]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="5xl"
      backdrop="opaque"
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col items-start gap-1">
              <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {data
                  ? `Census Tract ${formatCensusTractId(data.census_tract_info.geoid)}`
                  : "Census Tract"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </div>
              {data && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 rounded-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {/* Minimal Tab Bar */}
              <div
                className="mt-3 w-full border-b border-gray-200 dark:border-gray-800"
                role="tablist"
                aria-label="Tract insights tabs"
                onKeyDown={onTabKeyDown}
              >
                <div className="flex gap-4">
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={tab === t.key}
                      onClick={() => setTab(t.key)}
                      className={`pb-2 -mb-px border-b-2 transition-colors text-sm ${
                        tab === t.key
                          ? "border-blue-600 text-gray-900 dark:text-white"
                          : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                  <div className="flex-1" />
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="px-6 pb-8">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Spinner size="lg" />
                </div>
              ) : !data ? (
                <div className="text-gray-500">No data available.</div>
              ) : (
                <div className="space-y-6">
                  {tab === "overview" && (
                    <div className="space-y-6">
                      {/* Headline + split layout */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {/* Left: narrative + KPIs */}
                        <div className="md:col-span-3 space-y-3">
                          <div className="text-[15px] leading-6 text-gray-900 dark:text-gray-100">
                            {headline}
                          </div>
                          {comparative && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {comparative}
                            </div>
                          )}
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            <KpiCard
                              label="Population"
                              value={data.census_tract_info.total_population.toLocaleString()}
                              variant="blue"
                            />
                            <KpiCard
                              label="Median Age"
                              value={String(
                                data.census_tract_info.median_age ?? "N/A"
                              )}
                              variant="purple"
                            />
                            <KpiCard
                              label="Median HH Income"
                              value={formatCurrency(
                                data.income_summary?.median_household_income ??
                                  null
                              )}
                              variant="green"
                            />
                            <KpiCard
                              label="Poverty Rate"
                              value={formatPercentage(
                                data.income_summary?.poverty_rate ?? null
                              )}
                              variant="orange"
                            />
                            {(() => {
                              const srRaw: number | string | undefined = data
                                .census_tract_info.sex_ratio as unknown as
                                | number
                                | string
                                | undefined;
                              const sr =
                                typeof srRaw === "string"
                                  ? Number(srRaw)
                                  : srRaw;
                              const val =
                                sr != null && !Number.isNaN(sr)
                                  ? sr.toFixed(1)
                                  : "N/A";
                              return (
                                <KpiCard
                                  label="Sex Ratio"
                                  value={val}
                                  hint="males per 100 females"
                                  variant="gray"
                                />
                              );
                            })()}
                            {(() => {
                              const depRaw: number | string | undefined = data
                                .census_tract_info
                                .age_dependency_ratio as unknown as
                                | number
                                | string
                                | undefined;
                              const dep =
                                typeof depRaw === "string"
                                  ? Number(depRaw)
                                  : depRaw;
                              const val =
                                dep != null && !Number.isNaN(dep)
                                  ? `${dep.toFixed(1)}%`
                                  : "N/A";
                              return (
                                <KpiCard
                                  label="Dependency"
                                  value={val}
                                  hint="dependents per 100 working-age"
                                  variant="gray"
                                />
                              );
                            })()}
                          </div>
                        </div>
                        {/* Right: compact donut + persona */}
                        <div className="md:col-span-2 space-y-3">
                          <ChartCard
                            title="Age Composition"
                            subtitle="Children / Working Age / Seniors"
                          >
                            <AgeMixDonut
                              ageGroups={data.age_groups}
                              height={200}
                            />
                          </ChartCard>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {persona}
                          </div>
                        </div>
                      </div>

                      {/* Supporting mini chart (race removed from overview) */}
                      <div className="grid grid-cols-1 gap-6">
                        <ChartCard
                          title="Income Buckets"
                          subtitle="Low (<$25k), Middle ($25k–$75k), High (>$75k)"
                        >
                          <IncomeBucketBar
                            distribution={data.income_distribution}
                            height={140}
                          />
                        </ChartCard>
                      </div>
                      {/* Machine summary as detail */}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {overviewSummary}
                      </div>
                    </div>
                  )}

                  {tab === "age" && (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {(() => {
                          const total =
                            data.census_tract_info.total_population || 0;
                          const g = data.gender_distribution;
                          const male = g.male || 0;
                          const female = g.female || 0;
                          const malePct =
                            total > 0
                              ? ((male / total) * 100).toFixed(1)
                              : "0.0";
                          const femalePct =
                            total > 0
                              ? ((female / total) * 100).toFixed(1)
                              : "0.0";
                          return `Median age ${data.census_tract_info.median_age ?? "N/A"}. Gender balance: ${malePct}% male, ${femalePct}% female. Adults: ${((data.age_groups.adults / Math.max(1, total)) * 100).toFixed(1)}%.`;
                        })()}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {hasPyramid ? (
                          <>
                            <ChartCard
                              title="Age Cohorts"
                              subtitle="Share of population by age and sex"
                            >
                              <AgeCohortBars
                                ageDistribution={data.age_distribution}
                              />
                            </ChartCard>
                            <ChartCard
                              title="Gender Composition"
                              subtitle="Share of population"
                            >
                              <GenderDistributionChart
                                genderData={data.gender_distribution}
                              />
                            </ChartCard>
                          </>
                        ) : (
                          <>
                            <ChartCard
                              title="Age Groups"
                              subtitle="Population by broad age"
                            >
                              <AgeDistributionChart
                                ageGroups={data.age_groups}
                              />
                            </ChartCard>
                            <ChartCard
                              title="Gender Composition"
                              subtitle="Share of population"
                            >
                              <GenderDistributionChart
                                genderData={data.gender_distribution}
                              />
                            </ChartCard>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {tab === "race" && (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {(() => {
                          const entries = Object.entries(
                            data.race_distribution || {}
                          );
                          if (!entries.length)
                            return "No race composition data.";
                          const total = Math.max(
                            1,
                            entries.reduce((s, [, c]) => s + c, 0)
                          );
                          const sorted = entries.sort((a, b) => b[1] - a[1]);
                          const top1 = sorted[0];
                          const top2 = sorted[1];
                          const part = (e?: [string, number]) =>
                            e
                              ? `${e[0]} (${((e[1] / total) * 100).toFixed(1)}%)`
                              : "";
                          return `Largest groups: ${part(top1)}${top2 ? `, ${part(top2)}` : ""}.`;
                        })()}
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        <ChartCard
                          title="Race Composition"
                          subtitle="Population share by race/ethnicity"
                        >
                          <RaceStackedBar100 race={data.race_distribution} />
                        </ChartCard>
                      </div>
                    </div>
                  )}

                  {tab === "income" && (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {(() => {
                          const inc = data.income_summary;
                          if (!inc) return "No income data available.";
                          const parts = [] as string[];
                          if (inc.median_household_income != null)
                            parts.push(
                              `Median HH income ${formatCurrency(inc.median_household_income)}`
                            );
                          if (inc.poverty_rate != null)
                            parts.push(
                              `Poverty ${inc.poverty_rate.toFixed(1)}%`
                            );
                          if (inc.households_total != null)
                            parts.push(
                              `${inc.households_total.toLocaleString()} households`
                            );
                          return parts.join(" · ");
                        })()}
                      </div>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <KpiCard
                            label="Median HH Income"
                            value={formatCurrency(
                              data.income_summary?.median_household_income ??
                                null
                            )}
                            variant="green"
                          />
                          <KpiCard
                            label="Per Capita"
                            value={formatCurrency(
                              data.income_summary?.per_capita_income ?? null
                            )}
                            variant="green"
                          />
                          <KpiCard
                            label="Poverty Rate"
                            value={formatPercentage(
                              data.income_summary?.poverty_rate ?? null
                            )}
                            variant="orange"
                          />
                          <KpiCard
                            label="Households"
                            value={formatInteger(
                              data.income_summary?.households_total ?? null
                            )}
                            variant="blue"
                          />
                        </div>
                        <ChartCard
                          title="Income Distribution"
                          subtitle="Households by income bracket (median band highlighted)"
                          footer={
                            data.income_summary?.median_household_income
                              ? `Median: ${formatCurrency(data.income_summary.median_household_income)}`
                              : undefined
                          }
                        >
                          <IncomeHistogram
                            distribution={data.income_distribution}
                            median={
                              data.income_summary?.median_household_income ??
                              null
                            }
                          />
                        </ChartCard>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default TractInsightModal;
