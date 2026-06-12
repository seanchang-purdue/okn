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
        className="flex w-full items-center gap-2 border-b border-slate-200 px-4 py-2 text-left text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60"
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
        <span>Recents ({items.length})</span>
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
        <ul className="max-h-[160px] overflow-y-auto border-b border-slate-200 py-1 dark:border-slate-700">
          {items.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center px-4 py-1.5 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60"
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
