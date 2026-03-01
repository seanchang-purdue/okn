import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@heroui/react";
import type { Map as MapboxMap } from "mapbox-gl";
import ExportCsvButton from "./ExportCsvButton";
import ExportMapImageButton from "./ExportMapImageButton";
import EmbedCodeModal from "../embed/EmbedCodeModal";

interface ExportMenuProps {
  map: MapboxMap | null;
  data?: GeoJSON.FeatureCollection | null;
}

const ExportMenu = ({ map, data }: ExportMenuProps) => {
  const [open, setOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current.contains(target)) return;
      setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", onDocClick);
    }

    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open]);

  const embedUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("embed", "true");
    return url.toString();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Button
        isIconOnly
        variant="light"
        onPress={() => setOpen((prev) => !prev)}
        className="rounded-full transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
        aria-label="Export menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </Button>

      {open && (
        <div className="absolute right-full top-0 mr-2 z-50 w-52 rounded-xl border border-[var(--chat-border)] bg-white/95 p-2 shadow-xl backdrop-blur-sm dark:bg-slate-900/95">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--chat-muted)]">
            Export
          </p>
          <div className="space-y-2">
            <ExportCsvButton map={map} data={data} />
            <ExportMapImageButton map={map} />
            <Button
              size="sm"
              variant="flat"
              className="w-full justify-start"
              onPress={() => {
                setOpen(false);
                setEmbedOpen(true);
              }}
            >
              Generate Embed Code
            </Button>
          </div>
        </div>
      )}

      <EmbedCodeModal
        isOpen={embedOpen}
        onOpenChange={setEmbedOpen}
        embedUrl={embedUrl}
      />
    </div>
  );
};

export default ExportMenu;
