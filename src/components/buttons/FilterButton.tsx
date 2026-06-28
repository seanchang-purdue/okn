import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FilterButtonProps {
  onToggle: () => void;
  isActive?: boolean;
}

const FilterButton = ({ onToggle, isActive = false }: FilterButtonProps) => {
  const label = isActive ? "Close filters" : "Open filters";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={label}
            onClick={onToggle}
            className={cn(
              "rounded-full transition-colors",
              isActive
                ? "border-accent bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent"
                : "border-line-1 bg-surface-1 text-ink-1 hover:border-accent/50 hover:text-accent"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              className="size-4.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M7 12h10M10 18h4"
              />
            </svg>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FilterButton;
