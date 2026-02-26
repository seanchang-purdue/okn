import { Button, Tooltip } from "@heroui/react";
import MaterialFilter from "../../icons/material-filter.svg";

interface FilterButtonProps {
  onOpen: () => void;
  isExpanded: boolean;
}

const FilterButton = ({ onOpen, isExpanded }: FilterButtonProps) => {
  return (
    <Tooltip
      content="Apply Filters"
      placement={isExpanded ? "left" : "right"}
      className="bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    >
      <Button
        isIconOnly
        onPress={onOpen}
        variant="light"
        className="transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
      >
        <img src={MaterialFilter.src} alt="Apply Filters" />
      </Button>
    </Tooltip>
  );
};

export default FilterButton;
