import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Map as MapboxMap } from "mapbox-gl";
import { Button } from "@/components/ui/button";
import {
  buildCsvFromFeatureCollection,
  downloadTextFile,
  getExportFeatureCollection,
} from "../../utils/export/toCsv";

interface ExportCsvButtonProps {
  map: MapboxMap | null;
  data?: GeoJSON.FeatureCollection | null;
  className?: string;
}

const ExportCsvButton = ({ map, data, className }: ExportCsvButtonProps) => {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  const filename = useMemo(() => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `okn-incidents-${stamp}.csv`;
  }, []);

  const onExport = async () => {
    try {
      setExporting(true);
      setMessage("");

      const collection = getExportFeatureCollection(map, data);
      if (!collection || !collection.features || collection.features.length === 0) {
        setMessage("No data available to export.");
        return;
      }

      const { csv, rowCount } = buildCsvFromFeatureCollection(collection);
      downloadTextFile(csv, filename, "text/csv;charset=utf-8;");
      setMessage(`Exported ${rowCount} rows.`);
    } catch (error) {
      console.error("CSV export failed", error);
      setMessage("CSV export failed.");
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
        Export CSV
      </Button>
      {message && <p className="mt-1 text-[11px] text-muted-foreground">{message}</p>}
    </div>
  );
};

export default ExportCsvButton;
