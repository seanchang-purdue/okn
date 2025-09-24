/**
 * Format a census tract code as a 4-digit base with an optional two-digit suffix.
 * The suffix is separated by a decimal, and leading zeros in the base are removed.
 */
export const formatCensusTractId = (
  rawValue: string | number | null | undefined
): string => {
  if (rawValue === null || rawValue === undefined) {
    return "Unknown";
  }

  const stringValue = String(rawValue).trim();
  if (stringValue.length === 0) {
    return "Unknown";
  }

  // If the value already has a decimal, only trim leading zeros in the base portion.
  if (stringValue.includes(".")) {
    const [basePart, suffixPart = ""] = stringValue.split(".");
    const trimmedBase = basePart.replace(/^0+/, "") || "0";
    return suffixPart.length > 0 ? `${trimmedBase}.${suffixPart}` : trimmedBase;
  }

  // Strip non-digits and ensure we have a six-digit sequence to parse.
  const digitsOnly = stringValue.replace(/\D/g, "");
  if (digitsOnly.length === 0) {
    return stringValue;
  }

  const tractDigits =
    digitsOnly.length <= 6 ? digitsOnly : digitsOnly.slice(-6);

  const padded = tractDigits.padStart(6, "0");
  const base = padded.slice(0, 4);
  const suffix = padded.slice(4);
  const trimmedBase = base.replace(/^0+/, "") || "0";

  if (suffix === "00") {
    return trimmedBase;
  }

  return `${trimmedBase}.${suffix}`;
};
