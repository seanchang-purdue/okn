import { memo, useMemo, useState } from "react";
import type { TableBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";

interface TableBlockProps {
  data: TableBlockData;
}

type SortDirection = "asc" | "desc";

const toDisplay = (value: unknown): string => {
  if (value === null || typeof value === "undefined") return "-";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value);
};

const toSortableValue = (value: unknown): string | number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
    return value.toLowerCase();
  }
  return toDisplay(value).toLowerCase();
};

const TableBlock = ({ data }: TableBlockProps) => {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expanded, setExpanded] = useState(false);

  const sortedRows = useMemo(() => {
    if (sortColumn === null) return data.rows;

    return [...data.rows].sort((a, b) => {
      const left = toSortableValue(a[sortColumn]);
      const right = toSortableValue(b[sortColumn]);

      if (left < right) return sortDirection === "asc" ? -1 : 1;
      if (left > right) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data.rows, sortColumn, sortDirection]);

  const showCollapsed = sortedRows.length > 10 && !expanded;
  const visibleRows = showCollapsed ? sortedRows.slice(0, 5) : sortedRows;

  const handleSort = (columnIndex: number) => {
    if (sortColumn !== columnIndex) {
      setSortColumn(columnIndex);
      setSortDirection("asc");
      return;
    }
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <InsightBlock title="Table">
      <div className="overflow-x-auto rounded-lg border border-[var(--chat-border)]">
        <div className="max-h-72 overflow-auto">
          <table className="min-w-full border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-[var(--apple-notion-pill)]">
              <tr>
                {data.columns.map((column, columnIndex) => (
                  <th
                    key={column}
                    className="whitespace-nowrap border-b border-[var(--chat-border)] px-3 py-2 text-[13px] font-semibold text-[var(--chat-title)] dark:text-slate-100"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(columnIndex)}
                      className="inline-flex items-center gap-1"
                    >
                      <span>{column}</span>
                      {sortColumn === columnIndex && (
                        <span className="text-[10px] text-[var(--chat-muted)]">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, rowIndex) => (
                <tr
                  key={`row-${rowIndex}`}
                  className={rowIndex % 2 === 0 ? "bg-transparent" : "bg-[var(--apple-notion-pill)]/55"}
                >
                  {data.columns.map((_, cellIndex) => (
                    <td
                      key={`cell-${rowIndex}-${cellIndex}`}
                      className="whitespace-nowrap border-b border-[var(--chat-border)]/60 px-3 py-2 text-[13px] text-slate-700 dark:text-slate-200"
                    >
                      {toDisplay(row[cellIndex])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sortedRows.length > 10 && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="apple-notion-pill rounded-full px-3 py-1 text-xs font-medium text-[var(--chat-muted)]"
          >
            {expanded ? "Show less" : `Show all (${sortedRows.length})`}
          </button>
        </div>
      )}
    </InsightBlock>
  );
};

export default memo(TableBlock);
