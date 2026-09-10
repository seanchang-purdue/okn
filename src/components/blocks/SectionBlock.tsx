import { memo, type ReactNode } from "react";
import type { SectionBlockData } from "../../types/insight";

interface SectionBlockProps {
  data: SectionBlockData;
  children: ReactNode;
}

/**
 * Presentational layout container. Renders a titled group: a heading sized by
 * `data.level` (1 = section, 2 = subsection) followed by the already-rendered
 * children slot. This component does NOT recurse — the ReportRenderer passes in
 * the rendered nested blocks as `children`.
 */
const SectionBlock = ({ data, children }: SectionBlockProps) => {
  const isTopLevel = data.level === 1;

  return (
    <section className={isTopLevel ? "mt-5 first:mt-0" : "mt-3 first:mt-0"}>
      {isTopLevel ? (
        <h2 className="text-sm font-semibold text-foreground">{data.heading}</h2>
      ) : (
        <h3 className="text-sm font-semibold text-muted-foreground">
          {data.heading}
        </h3>
      )}
      <div
        className={`flex flex-col gap-3 ${
          isTopLevel ? "mt-2.5" : "mt-1.5"
        }`}
      >
        {children}
      </div>
    </section>
  );
};

export default memo(SectionBlock);
