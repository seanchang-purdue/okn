import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { Autocomplete, AutocompleteItem, Button, Tooltip } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";

type City = {
  key: string;
  name: string;
  center: [number, number]; // [lng, lat]
  zoom?: number;
};

interface CitySelectButtonProps {
  onSelect: (city: City) => void;
  isExpanded: boolean;
}

const CitySelectButton = ({ onSelect, isExpanded }: CitySelectButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const cities = useMemo<City[]>(
    () => [
      {
        key: "philadelphia",
        name: "Philadelphia",
        center: [-75.1652, 39.9526],
        zoom: 11,
      },
      {
        key: "chicago",
        name: "Chicago",
        center: [-87.6298, 41.8781],
        zoom: 11,
      },
    ],
    []
  );

  const findCityByName = useCallback(
    (name: string) => {
      const q = name.trim().toLowerCase();
      if (!q) return null;
      return (
        cities.find((c) => c.name.toLowerCase() === q) ||
        cities.find((c) => c.name.toLowerCase().startsWith(q)) ||
        cities.find((c) => c.name.toLowerCase().includes(q)) ||
        null
      );
    },
    [cities]
  );

  const handleSelectionChange = (key: React.Key | null) => {
    if (!key) return;
    const city = cities.find((c) => c.key === String(key));
    if (city) {
      onSelect(city);
      setOpen(false);
      setInputValue("");
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      const city = findCityByName(inputValue);
      if (city) {
        onSelect(city);
        setOpen(false);
        setInputValue("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Don't close if clicking inside our container
      if (containerRef.current.contains(target)) return;

      // HeroUI/NextUI Autocomplete often portals the listbox/popover.
      // Ignore clicks inside those overlays so selection works without premature close.
      const inOverlay = target.closest(
        '[role="listbox"], [data-slot="popover"], [data-overlay-container]'
      );
      if (inOverlay) return;

      setOpen(false);
    };
    if (open) {
      document.addEventListener("click", onDocClick);
    }
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Tooltip
        content="Jump to city"
        placement={isExpanded ? "left" : "right"}
        className="bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100"
      >
        <Button
          isIconOnly
          variant="light"
          onPress={() => setOpen((v) => !v)}
          className="rounded-full transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </Button>
      </Tooltip>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-0 right-full mr-2 z-50"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="w-64 rounded-full overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <Autocomplete<City>
                aria-label="Select a city"
                placeholder="Search city..."
                onSelectionChange={handleSelectionChange}
                onInputChange={setInputValue}
                onKeyDown={handleKeyDown}
                size="sm"
                className="min-w-[16rem]"
                menuTrigger="input"
                defaultItems={cities}
              >
                {(item: City) => (
                  <AutocompleteItem key={item.key} textValue={item.name}>
                    {item.name}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CitySelectButton;
