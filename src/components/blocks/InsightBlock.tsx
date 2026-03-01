import { useState, type ReactNode } from "react";

interface InsightBlockProps {
  children: ReactNode;
  title?: string;
  meta?: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const InsightBlock = ({
  children,
  title,
  meta,
  className = "",
  collapsible = false,
  defaultCollapsed = false,
}: InsightBlockProps) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section
      className={`animate-chat-fade-in rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      {(title || meta || collapsible) && (
        <header className="mb-2 flex items-center justify-between gap-2">
          <div>
            {title && (
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            {meta && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{meta}</div>}
          </div>

          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              aria-label={collapsed ? "Expand block" : "Collapse block"}
            >
              {collapsed ? "Show" : "Hide"}
            </button>
          )}
        </header>
      )}

      {!collapsed && children}
    </section>
  );
};

export default InsightBlock;
