import { Button, Tooltip } from "@heroui/react";
import MaterialFilter from "../../icons/material-filter.svg";

interface FilterButtonProps {
  onOpen: () => void;
  isExpanded: boolean;
}

const FilterButton = ({ onOpen, isExpanded }: FilterButtonProps) => {
  return (
    <Tooltip content="Apply Filters" placement={isExpanded ? "left" : "right"}>
      <Button isIconOnly color="primary" onClick={onOpen} variant="light">
        <img src={MaterialFilter.src} alt="Apply Filters" />
      </Button>
    </Tooltip>
  );
};

export default FilterButton;
