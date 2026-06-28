import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { Map as MapboxMap } from "mapbox-gl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import ExportCsvButton from "./ExportCsvButton";
import ExportMapImageButton from "./ExportMapImageButton";
import EmbedCodeModal from "../embed/EmbedCodeModal";

interface ExportMenuProps {
  map: MapboxMap | null;
  data?: GeoJSON.FeatureCollection | null;
}

const ExportMenu = ({ map, data }: ExportMenuProps) => {
  const [embedOpen, setEmbedOpen] = useState(false);

  const embedUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("embed", "true");
    return url.toString();
  }, []);

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
            aria-label="Export menu"
          >
            <Download className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" align="start" className="w-52">
          <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Export
          </DropdownMenuLabel>
          <div className="space-y-2 px-1 py-1">
            <ExportCsvButton map={map} data={data} />
            <ExportMapImageButton map={map} />
          </div>
          <DropdownMenuItem onSelect={() => setEmbedOpen(true)}>
            Generate Embed Code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EmbedCodeModal
        isOpen={embedOpen}
        onOpenChange={setEmbedOpen}
        embedUrl={embedUrl}
      />
    </div>
  );
};

export default ExportMenu;
