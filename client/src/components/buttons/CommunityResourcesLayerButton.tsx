import type { Key } from "react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import type { ResourceType } from "../../types/communityResources";

export type ResourceFilterOption = "all" | ResourceType;

interface CommunityResourcesLayerButtonProps {
  resourcesLayerVisible: boolean;
  setResourcesLayerVisible: (visible: boolean) => void;
  resourceFilter: ResourceFilterOption;
  onResourceFilterChange: (filter: ResourceFilterOption) => void;
  isExpanded: boolean;
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

type FilterMenuKey = ResourceFilterOption | "hide";

const CommunityResourcesLayerButton = ({
  resourcesLayerVisible,
  setResourcesLayerVisible,
  resourceFilter,
  onResourceFilterChange,
  isExpanded,
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
    <Dropdown placement={isExpanded ? "left" : "right"} closeOnSelect>
      <DropdownTrigger>
        <Button
          aria-label={tooltipContent}
          title={tooltipContent}
          isIconOnly
          radius="full"
          size="sm"
          variant={resourcesLayerVisible ? "solid" : "light"}
          className="h-10 w-10 min-w-0 px-0 transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
          onPress={() => {
            if (!resourcesLayerVisible) {
              setResourcesLayerVisible(true);
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={resourcesLayerVisible ? FILTER_COLORS[resourceFilter] : "none"}
            stroke="currentColor"
            strokeWidth={resourcesLayerVisible ? 0 : 2}
            className="w-6 h-6 text-gray-700 dark:text-gray-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Community resource filters"
        selectionMode="single"
        selectedKeys={new Set<Key>([selectedKey])}
        onAction={(key) => handleSelection(key as FilterMenuKey)}
      >
        <DropdownItem key="all" description="Food, shelter, and mental health">
          All resources
        </DropdownItem>
        <DropdownItem key="food" description="Food pantries & kitchens">
          Food only
        </DropdownItem>
        <DropdownItem key="shelter" description="Emergency and long-term housing">
          Shelters only
        </DropdownItem>
        <DropdownItem
          key="mental_health"
          description="Counseling & crisis support"
        >
          Mental health only
        </DropdownItem>
        <DropdownItem key="hide" color="danger">
          Hide resources
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default CommunityResourcesLayerButton;
