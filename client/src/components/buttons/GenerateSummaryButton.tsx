import { Button, Tooltip } from "@heroui/react";
import { useState } from "react";
import useChat from "../../hooks/useChat";

const GenerateSummaryButton = () => {
  const { generateSummary, loading } = useChat();
  const [gradientStyle, setGradientStyle] = useState({
    background: "linear-gradient(135deg, #1d4ed8, #38bdf8)",
  });

  const moveGradient = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = (event.target as HTMLButtonElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setGradientStyle({
      background: `radial-gradient(circle at ${x}% ${y}%, #38bdf8, #1d4ed8)`,
    });
  };

  const leaveGradient = () => {
    setGradientStyle({
      background: "linear-gradient(135deg, #1d4ed8, #38bdf8)",
    });
  };

  return (
    <Tooltip
      content="✨ Click to generate a analytical summary! Get instant insights based on your filters and census tracts selections"
      placement="top"
    >
      <Button
        className="text-white shadow-lg transition-all duration-150 ease-in-out hover:shadow-md hover:shadow-blue-400/50 hover:scale-105 active:scale-100"
        radius="full"
        size="lg"
        style={gradientStyle}
        isLoading={loading}
        onPress={generateSummary}
        onMouseMove={moveGradient}
        onMouseLeave={leaveGradient}
      >
        Generate Summary
      </Button>
    </Tooltip>
  );
};

export default GenerateSummaryButton;
