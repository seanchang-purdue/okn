import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useChat from "../../hooks/useChat";

const GenerateSummaryButton = () => {
  const { generateSummary, loading } = useChat();

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="lg"
            disabled={loading}
            onClick={generateSummary}
            className="rounded-full shadow-sm transition-transform duration-150 ease-in-out hover:scale-105 active:scale-100"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Generate Summary
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-center">
          Generate an analytical summary — instant insights based on your filters
          and census tract selections
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GenerateSummaryButton;
