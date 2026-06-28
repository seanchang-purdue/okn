import { useStore } from "@nanostores/react";
import { Zap, FlaskConical } from "lucide-react";
import { queryModeStore, chatLayoutActions } from "../../stores/chatLayoutStore";
import { cn } from "@/lib/utils";

type Mode = "auto" | "research";

const OPTIONS: Array<{ value: Mode; label: string; Icon: typeof Zap }> = [
  { value: "auto", label: "Auto", Icon: Zap },
  { value: "research", label: "Research", Icon: FlaskConical },
];

const QueryModeToggle = () => {
  const mode = useStore(queryModeStore);

  return (
    <div
      role="group"
      aria-label="Query mode"
      className="inline-flex items-center gap-0.5 rounded-lg border border-input bg-muted p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => chatLayoutActions.setQueryMode(value)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default QueryModeToggle;
