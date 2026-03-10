// src/utils/pivotRows.ts

export interface PivotResult {
  tableRows: Record<string, string | number | null>[];
  colKeys: string[];
}

export function pivotRows(
  rows: Record<string, string | number>[],
  rowDims: string[],
  colDims: string[]
): PivotResult {
  if (rows.length === 0) return { tableRows: [], colKeys: [] };

  if (colDims.length === 0) {
    const tableRows = rows.map((r) => ({ ...r, _total: r.value }));
    return { tableRows, colKeys: [] };
  }

  const colKeySet = new Set<string>();
  for (const row of rows) {
    colKeySet.add(colDims.map((d) => String(row[d])).join(" / "));
  }
  const colKeys = [...colKeySet].sort();

  const groups = new Map<string, Record<string, string | number | null>>();
  for (const row of rows) {
    const rowKey = rowDims.map((d) => String(row[d])).join("|");
    if (!groups.has(rowKey)) {
      const entry: Record<string, string | number | null> = {};
      for (const d of rowDims) entry[d] = row[d];
      for (const ck of colKeys) entry[ck] = null;
      entry._total = null;
      groups.set(rowKey, entry);
    }
    const colKey = colDims.map((d) => String(row[d])).join(" / ");
    const entry = groups.get(rowKey)!;
    entry[colKey] = row.value;
    entry._total = ((entry._total as number) ?? 0) + (row.value as number);
  }

  return { tableRows: [...groups.values()], colKeys };
}

export function computeColTotals(
  tableRows: Record<string, string | number | null>[],
  colKeys: string[]
): Record<string, number | null> {
  const totals: Record<string, number | null> = { _total: null };
  for (const ck of colKeys) {
    totals[ck] = tableRows.reduce((sum, r) => {
      const v = r[ck];
      return typeof v === "number" ? sum + v : sum;
    }, 0);
    if (totals[ck] !== null)
      totals._total = ((totals._total ?? 0) as number) + (totals[ck] as number);
  }
  return totals;
}
