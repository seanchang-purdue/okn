import { Button, Tooltip } from "@heroui/react";
import ExpandIcon from "../../icons/arrow-expand.svg";
import ShrinkIcon from "../../icons/arrow-shrink.svg";

interface ExpandMapButtonProps {
  isExpanded: boolean;
  toggleExpand: () => void;
}

const ExpandMapButton = ({
  isExpanded,
  toggleExpand,
}: ExpandMapButtonProps) => {
  return (
    <Tooltip
      content={isExpanded ? "Shrink map" : "Expand map"}
      placement={isExpanded ? "left" : "right"}
      className="bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    >
      <Button isIconOnly onPress={toggleExpand} variant="light">
        <img
          src={isExpanded ? ShrinkIcon.src : ExpandIcon.src}
          alt={isExpanded ? "Shrink map" : "Expand map"}
        />
      </Button>
    </Tooltip>
  );
};

export default ExpandMapButton;
