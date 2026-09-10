import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ResourceType } from "../../types/communityResources";

export type ResourceFilterOption = "all" | ResourceType;

interface CommunityResourcesLayerButtonProps {
  resourcesLayerVisible: boolean;
  setResourcesLayerVisible: (visible: boolean) => void;
  resourceFilter: ResourceFilterOption;
  onResourceFilterChange: (filter: ResourceFilterOption) => void;
}

const FILTER_LABELS: Record<ResourceFilterOption, string> = {
  all: "All resources",
  food: "Food only",
  shelter: "Shelters only",
  mental_health: "Mental health only",
};

const FILTER_COLORS: Record<ResourceFilterOption, string> = {
  all: "currentColor",
  food: "#22c55e",
  shelter: "#3b82f6",
  mental_health: "#a855f7",
};

const FILTER_DESCRIPTIONS: Record<ResourceFilterOption, string> = {
  all: "Food, shelter, and mental health",
  food: "Food pantries & kitchens",
  shelter: "Emergency and long-term housing",
  mental_health: "Counseling & crisis support",
};

type FilterMenuKey = ResourceFilterOption | "hide";

const RadioOption = ({ value }: { value: ResourceFilterOption }) => (
  <DropdownMenuRadioItem value={value} className="items-start py-2">
    <span className="flex flex-col gap-0.5">
      <span className="text-sm">{FILTER_LABELS[value]}</span>
      <span className="text-xs text-muted-foreground">
        {FILTER_DESCRIPTIONS[value]}
      </span>
    </span>
  </DropdownMenuRadioItem>
);

const CommunityResourcesLayerButton = ({
  resourcesLayerVisible,
  setResourcesLayerVisible,
  resourceFilter,
  onResourceFilterChange,
}: CommunityResourcesLayerButtonProps) => {
  const selectedKey: FilterMenuKey = resourcesLayerVisible
    ? resourceFilter
    : "hide";

  const tooltipContent = resourcesLayerVisible
    ? `Resources: ${FILTER_LABELS[resourceFilter]}`
    : "Show community resources";

  const handleSelection = (key: FilterMenuKey) => {
    if (key === "hide") {
      setResourcesLayerVisible(false);
      return;
    }
    onResourceFilterChange(key);
    setResourcesLayerVisible(true);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={resourcesLayerVisible ? "secondary" : "ghost"}
          size="icon"
          aria-label={tooltipContent}
          title={tooltipContent}
          onClick={() => {
            if (!resourcesLayerVisible) {
              setResourcesLayerVisible(true);
            }
          }}
          className="rounded-full text-muted-foreground transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={resourcesLayerVisible ? FILTER_COLORS[resourceFilter] : "none"}
            stroke="currentColor"
            strokeWidth={resourcesLayerVisible ? 0 : 2}
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="left"
        aria-label="Community resource filters"
        className="w-60"
      >
        <DropdownMenuRadioGroup
          value={selectedKey}
          onValueChange={(value) => handleSelection(value as FilterMenuKey)}
        >
          <RadioOption value="all" />
          <RadioOption value="food" />
          <RadioOption value="shelter" />
          <RadioOption value="mental_health" />
          <DropdownMenuSeparator />
          <DropdownMenuRadioItem
            value="hide"
            className={cn("text-destructive focus:text-destructive")}
          >
            Hide resources
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CommunityResourcesLayerButton;
