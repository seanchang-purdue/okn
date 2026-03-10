// src/components/datacube/PivotTable.tsx
"use client";

import { pivotRows, computeColTotals } from "../../utils/pivotRows";
import type { DatacubeQueryResponse } from "../../types/datacube";

interface Props {
  result: DatacubeQueryResponse;
}

function fmt(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}

export default function PivotTable({ result }: Props) {
  const { rows, meta } = result;
  const { tableRows, colKeys } = pivotRows(rows, meta.row_dims, meta.col_dims);
  const colTotals = computeColTotals(tableRows, colKeys);

  const showTotal = colKeys.length > 0;

  return (
    <div className="overflow-auto w-full h-full">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-content2 text-foreground/70">
            {meta.row_dims.map((d) => (
              <th
                key={d}
                className="px-3 py-2 text-left font-semibold sticky left-0 bg-content2 border-b border-default-200"
              >
                {d}
              </th>
            ))}
            {colKeys.map((ck) => (
              <th key={ck} className="px-3 py-2 text-right font-semibold border-b border-default-200">
                {ck}
              </th>
            ))}
            {colKeys.length === 0 && (
              <th className="px-3 py-2 text-right font-semibold border-b border-default-200">
                Value
              </th>
            )}
            {showTotal && (
              <th className="px-3 py-2 text-right font-semibold border-b border-default-200 text-foreground/40">
                Total
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {tableRows.map((row, i) => (
            <tr key={i} className="border-b border-default-100 hover:bg-content2/50 transition-colors">
              {meta.row_dims.map((d) => (
                <td key={d} className="px-3 py-2 sticky left-0 bg-content1 font-medium">
                  {fmt(row[d] as string | number | null)}
                </td>
              ))}
              {colKeys.length === 0 ? (
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmt(row.value as string | number | null)}
                </td>
              ) : (
                colKeys.map((ck) => (
                  <td key={ck} className="px-3 py-2 text-right tabular-nums">
                    {fmt(row[ck] as string | number | null)}
                  </td>
                ))
              )}
              {showTotal && (
                <td className="px-3 py-2 text-right tabular-nums text-foreground/50">
                  {fmt(row._total as number | null)}
                </td>
              )}
            </tr>
          ))}
        </tbody>

        {showTotal && (
          <tfoot>
            <tr className="bg-content2 font-semibold border-t-2 border-default-300">
              {meta.row_dims.map((d, i) => (
                <td key={d} className="px-3 py-2 sticky left-0 bg-content2">
                  {i === 0 ? "Total" : ""}
                </td>
              ))}
              {colKeys.map((ck) => (
                <td key={ck} className="px-3 py-2 text-right tabular-nums">
                  {fmt(colTotals[ck] as number | null)}
                </td>
              ))}
              <td className="px-3 py-2 text-right tabular-nums text-foreground/50">
                {fmt(colTotals._total as number | null)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
