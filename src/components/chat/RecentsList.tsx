import { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
        className="flex w-full items-center gap-2 border-b border-border px-4 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
      >
        <Clock className="size-3.5" aria-hidden="true" />
        <span className="tabular-nums">Recents ({items.length})</span>
        <ChevronDown
          className={cn(
            "ml-auto size-3.5 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul className="max-h-[160px] overflow-y-auto border-b border-border py-1">
          {items.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center px-4 py-1.5 text-left text-sm text-foreground/80 transition-colors hover:bg-muted"
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
