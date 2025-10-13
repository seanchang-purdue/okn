// src/utils/format.ts

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)}%`;
};

export const formatInteger = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "N/A";
  return value.toLocaleString();
};

// Helpers for strict display formatting
export const fmtInt = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return "0";
  return Math.max(0, Math.round(n)).toLocaleString();
};

export const fmtPct = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return "0.0%";
  const v = Math.round(n * 10) / 10;
  return `${v.toFixed(1)}%`;
};
