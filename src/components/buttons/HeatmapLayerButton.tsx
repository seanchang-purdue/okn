import { Button, Tooltip } from "@heroui/react";

interface HeatmapLayerButtonProps {
  heatmapVisible: boolean;
  toggleHeatmap: () => void;
  isExpanded: boolean;
}

const HeatmapLayerButton = ({
  heatmapVisible,
  toggleHeatmap,
  isExpanded,
}: HeatmapLayerButtonProps) => {
  return (
    <Tooltip
      content={heatmapVisible ? "Hide shooting heatmap" : "Show shooting heatmap"}
      placement={isExpanded ? "left" : "right"}
      className="bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    >
      <Button
        isIconOnly
        onPress={toggleHeatmap}
        variant="light"
        className="transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-6 h-6 text-gray-700 dark:text-gray-300"
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
    </Tooltip>
  );
};

export default HeatmapLayerButton;
