import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Map as MapboxMap } from "mapbox-gl";
import { Button } from "@/components/ui/button";

interface ExportMapImageButtonProps {
  map: MapboxMap | null;
  className?: string;
}

const downloadDataUrl = (dataUrl: string, filename: string) => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const ExportMapImageButton = ({ map, className }: ExportMapImageButtonProps) => {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  const filename = useMemo(() => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `okn-map-${stamp}.png`;
  }, []);

  const onExport = async () => {
    if (!map) {
      setMessage("Map is not ready yet.");
      return;
    }

    setExporting(true);
    setMessage("");

    try {
      await new Promise<void>((resolve) => {
        map.once("idle", () => resolve());
        map.triggerRepaint();
      });

      const canvas = map.getCanvas();
      const dataUrl = canvas.toDataURL("image/png");

      if (!dataUrl || dataUrl === "data:,") {
        throw new Error("Map image capture returned empty data.");
      }

      downloadDataUrl(dataUrl, filename);
      setMessage("Map image exported.");
    } catch (error) {
      console.error("Map image export failed", error);
      setMessage("Map image export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={className}>
      <Button
        size="sm"
        variant="outline"
        onClick={onExport}
        disabled={exporting}
        className="w-full justify-start"
      >
        {exporting && <Loader2 className="size-4 animate-spin" />}
        Export Map Image
      </Button>
      {message && <p className="mt-1 text-[11px] text-muted-foreground">{message}</p>}
    </div>
  );
};

export default ExportMapImageButton;
