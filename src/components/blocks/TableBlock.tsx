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
      <div className="overflow-x-auto rounded-lg border border-line-1">
        <div className="max-h-72 overflow-auto">
          <table className="min-w-full border-collapse text-left text-body tabular-nums">
            <thead className="sticky top-0 z-10 bg-surface-2">
              <tr>
                {data.columns.map((column, columnIndex) => (
                  <th
                    key={column}
                    className="whitespace-nowrap border-b border-line-1 px-3 py-2 text-body font-semibold text-ink-1"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(columnIndex)}
                      className="inline-flex items-center gap-1"
                    >
                      <span>{column}</span>
                      {sortColumn === columnIndex && (
                        <span className="text-caption text-ink-3">
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
                  className={rowIndex % 2 === 0 ? "bg-transparent" : "bg-surface-2/55"}
                >
                  {data.columns.map((_, cellIndex) => (
                    <td
                      key={`cell-${rowIndex}-${cellIndex}`}
                      className="whitespace-nowrap border-b border-line-1/60 px-3 py-2 text-body text-ink-2"
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
            className="apple-notion-pill rounded-md px-3 py-1 text-caption font-medium tabular-nums text-ink-3"
          >
            {expanded ? "Show less" : `Show all (${sortedRows.length})`}
          </button>
        </div>
      )}
    </InsightBlock>
  );
};

export default memo(TableBlock);
