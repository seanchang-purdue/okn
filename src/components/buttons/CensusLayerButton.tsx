import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MaterialBorder from "../../icons/material-border.svg";
import MaterialBorderClear from "../../icons/material-border-clear.svg";

interface CensusLayerButtonProps {
  censusLayersVisible: boolean;
  toggleCensusLayers: () => void;
}

const CensusLayerButton = ({
  censusLayersVisible,
  toggleCensusLayers,
}: CensusLayerButtonProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle census layers"
            onClick={toggleCensusLayers}
            className="text-muted-foreground transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
          >
            <img
              src={
                censusLayersVisible ? MaterialBorderClear.src : MaterialBorder.src
              }
              alt={
                censusLayersVisible ? "Hide census layers" : "Show census layers"
              }
              className="size-6 dark:invert"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Toggle census layers</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CensusLayerButton;
