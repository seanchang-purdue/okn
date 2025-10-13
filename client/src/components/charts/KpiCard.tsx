// src/components/charts/KpiCard.tsx
import React from "react";

type Variant = "blue" | "green" | "purple" | "orange" | "gray";

const variants: Record<Variant, { bg: string; text: string; badge: string }> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-200",
    badge: "bg-blue-100 dark:bg-blue-900/40",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-200",
    badge: "bg-green-100 dark:bg-green-900/40",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-200",
    badge: "bg-purple-100 dark:bg-purple-900/40",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-200",
    badge: "bg-orange-100 dark:bg-orange-900/40",
  },
  gray: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-800 dark:text-gray-200",
    badge: "bg-gray-200 dark:bg-gray-700",
  },
};

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  variant?: Variant;
};

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  hint,
  variant = "gray",
}) => {
  const v = variants[variant];
  return (
    <div
      className={`rounded-lg p-3 ${v.bg} border border-gray-200 dark:border-gray-700`}
    >
      <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
      <div className={`text-2xl font-bold ${v.text}`}>{value}</div>
      {hint ? (
        <div
          className={`inline-block mt-1 px-2 py-0.5 text-[11px] rounded ${v.badge} text-gray-700 dark:text-gray-300`}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
};

export default KpiCard;
