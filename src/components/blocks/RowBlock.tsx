import { Children, memo, type ReactNode } from "react";
import type { RowBlockData } from "../../types/insight";

interface RowBlockProps {
  data: RowBlockData;
  children: ReactNode[];
}

/**
 * Presentational side-by-side layout container. Renders one column per child,
 * applying `data.weights` (default equal) as flex-grow/basis, and stacks the
 * columns vertically on mobile. This component does NOT recurse — the
 * ReportRenderer passes in an array of already-rendered nested blocks.
 */
const RowBlock = ({ data, children }: RowBlockProps) => {
  const columns = Children.toArray(children);
  const weights = data.weights;
  const totalWeight =
    weights && weights.length > 0
      ? weights.reduce((sum, weight) => sum + (weight > 0 ? weight : 0), 0)
      : 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      {columns.map((column, index) => {
        const weight =
          weights && weights[index] && weights[index] > 0
            ? weights[index]
            : 1;
        // When explicit weights are provided, distribute basis proportionally;
        // otherwise let columns share space equally.
        const basis =
          totalWeight > 0
            ? `${(weight / totalWeight) * 100}%`
            : "0%";

        return (
          <div
            key={index}
            className="min-w-0 flex-1"
            style={{ flexGrow: weight, flexBasis: basis }}
          >
            {column}
          </div>
        );
      })}
    </div>
  );
};

export default memo(RowBlock);
