import { memo, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { TableBlockData } from "../../types/insight";
import InsightBlock from "./InsightBlock";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="max-h-72 overflow-auto">
          <Table className="tabular-nums">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                {data.columns.map((column, columnIndex) => (
                  <TableHead key={column} className="font-semibold text-foreground">
                    <button
                      type="button"
                      onClick={() => handleSort(columnIndex)}
                      className="inline-flex items-center gap-1"
                    >
                      <span>{column}</span>
                      {sortColumn === columnIndex &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="size-3 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-3 text-muted-foreground" />
                        ))}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row, rowIndex) => (
                <TableRow key={`row-${rowIndex}`}>
                  {data.columns.map((_, cellIndex) => (
                    <TableCell
                      key={`cell-${rowIndex}-${cellIndex}`}
                      className="text-muted-foreground"
                    >
                      {toDisplay(row[cellIndex])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {sortedRows.length > 10 && (
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
            className="tabular-nums"
          >
            {expanded ? "Show less" : `Show all (${sortedRows.length})`}
          </Button>
        </div>
      )}
    </InsightBlock>
  );
};

export default memo(TableBlock);
