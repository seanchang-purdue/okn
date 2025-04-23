import { Button, Tooltip } from "@heroui/react";
import MaterialFilter from "../../icons/material-filter.svg";

interface FilterButtonProps {
  onOpen: () => void;
  isExpanded: boolean;
}

const FilterButton = ({ onOpen, isExpanded }: FilterButtonProps) => {
  return (
    <Tooltip content="Apply Filters" placement={isExpanded ? "left" : "right" } className="bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100">
      <Button isIconOnly onPress={onOpen} variant="light">
        <img src={MaterialFilter.src} alt="Apply Filters" />
      </Button>
    </Tooltip>
  );
};

export default FilterButton;
