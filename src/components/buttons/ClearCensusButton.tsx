import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MaterialClear from "../../icons/material-clear.svg";
import { selectedCensusBlocks } from "../../stores/censusStore";

interface ClearCensusButtonProps {
  censusBlocks: string[];
}

const ClearCensusButton = ({ censusBlocks }: ClearCensusButtonProps) => {
  if (censusBlocks.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear selected census blocks"
            onClick={() => selectedCensusBlocks.set([])}
            className="text-muted-foreground transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
          >
            <img
              src={MaterialClear.src}
              alt="Clear selected census blocks"
              className="size-6 dark:invert"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Clear selected census blocks</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ClearCensusButton;
