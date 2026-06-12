import { useState } from "react";

interface RecentsListProps {
  items: string[];
  onSelect: (query: string) => void;
}

const RecentsList = ({ items, onSelect }: RecentsListProps) => {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 border-b border-line-1 px-4 py-2 text-left text-caption font-medium text-ink-3 transition-colors hover:bg-surface-3"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
        </svg>
        <span className="tabular-nums">Recents ({items.length})</span>
        <svg
          className={`ml-auto h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="max-h-[160px] overflow-y-auto border-b border-line-1 py-1">
          {items.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center px-4 py-1.5 text-left text-body text-ink-2 transition-colors hover:bg-surface-3"
              >
                <span className="truncate">{item}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentsList;
