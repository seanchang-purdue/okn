import { Button, Tooltip } from "@heroui/react";
import MaterialBorder from "../../icons/material-border.svg";
import MaterialBorderClear from "../../icons/material-border-clear.svg";

interface CensusLayerButtonProps {
  censusLayersVisible: boolean;
  toggleCensusLayers: () => void;
  isExpanded: boolean;
}

const CensusLayerButton = ({
  censusLayersVisible,
  toggleCensusLayers,
  isExpanded,
}: CensusLayerButtonProps) => {
  return (
    <Tooltip
      content="Toggle census layers"
      placement={isExpanded ? "left" : "right"}
      className="bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    >
      <Button isIconOnly onPress={toggleCensusLayers} variant="light">
        <img
          src={
            censusLayersVisible ? MaterialBorderClear.src : MaterialBorder.src
          }
          alt={
            censusLayersVisible ? "Hide census layers" : "Show census layers"
          }
        />
      </Button>
    </Tooltip>
  );
};

export default CensusLayerButton;
