import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatmapLayerButtonProps {
  heatmapVisible: boolean;
  toggleHeatmap: () => void;
}

const HeatmapLayerButton = ({
  heatmapVisible,
  toggleHeatmap,
}: HeatmapLayerButtonProps) => {
  const label = heatmapVisible ? "Hide shooting heatmap" : "Show shooting heatmap";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={toggleHeatmap}
            className="text-muted-foreground transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13c2-2.5 4.5-4 9-4s7 1.5 9 4"
                opacity={heatmapVisible ? 1 : 0.4}
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 17c1.5-1.8 3.5-2.7 7-2.7s5.5.9 7 2.7"
                opacity={heatmapVisible ? 1 : 0.4}
              />
              <circle
                cx={12}
                cy={8}
                r={2}
                fill={heatmapVisible ? "currentColor" : "none"}
              />
            </svg>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HeatmapLayerButton;
