import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CITIES } from "../../config/cities";

type City = {
  key: string;
  name: string;
  center: [number, number]; // [lng, lat]
  zoom?: number;
};

interface CitySelectButtonProps {
  onSelect: (city: City) => void;
}

const CitySelectButton = ({ onSelect }: CitySelectButtonProps) => {
  const cities: City[] = CITIES.map((c) => ({
    key: c.key,
    name: c.name,
    center: c.center,
    zoom: c.zoom,
  }));

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Jump to city"
                className="rounded-full text-muted-foreground transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-5"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">Jump to city</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent
        side="left"
        align="start"
        aria-label="Select a city"
        className="max-h-64 w-56 overflow-y-auto"
      >
        {cities.map((city) => (
          <DropdownMenuItem
            key={city.key}
            onSelect={() => onSelect(city)}
          >
            {city.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CitySelectButton;
