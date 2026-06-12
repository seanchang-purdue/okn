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
      className={`animate-chat-fade-in rounded-lg border border-line-1 bg-surface-1 px-4 py-3 ${className}`}
    >
      {(title || meta || collapsible) && (
        <header className="mb-2 flex items-center justify-between gap-2">
          <div>
            {title && (
              <h3 className="text-body font-semibold text-ink-1">
                {title}
              </h3>
            )}
            {meta && <div className="mt-0.5 text-caption text-ink-3">{meta}</div>}
          </div>

          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="rounded-md border border-line-1 bg-surface-2 px-2 py-1 text-caption font-medium text-ink-2"
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
