import { Button, Tooltip } from "@heroui/react";
import MaterialClear from "../../icons/material-clear.svg";
import { selectedCensusBlocks } from "../../stores/censusStore";

interface ClearCensusButtonProps {
  isExpanded: boolean;
  censusBlocks: any[]; // Replace 'any' with proper type
}

const ClearCensusButton = ({
  isExpanded,
  censusBlocks,
}: ClearCensusButtonProps) => {
  if (censusBlocks.length === 0) return null;

  return (
    <Tooltip
      content="Clear selected census blocks"
      placement={isExpanded ? "left" : "right"}
    >
      <Button
        isIconOnly
        color="primary"
        onPress={() => selectedCensusBlocks.set([])}
        variant="light"
      >
        <img src={MaterialClear.src} alt="Clear selected census blocks" />
      </Button>
    </Tooltip>
  );
};

export default ClearCensusButton;
