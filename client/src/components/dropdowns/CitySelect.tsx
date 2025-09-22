import { useMemo, useState, useCallback } from "react";
import type React from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";

type City = {
  key: string;
  name: string;
  center: [number, number]; // [lng, lat]
  zoom?: number;
};

interface CitySelectProps {
  onSelect: (city: City) => void;
}

const CitySelect = ({ onSelect }: CitySelectProps) => {
  const cities = useMemo<City[]>(
    () => [
      { key: "philadelphia", name: "Philadelphia", center: [-75.1652, 39.9526], zoom: 11 },
      { key: "chicago", name: "Chicago", center: [-87.6298, 41.8781], zoom: 11 },
    ],
    []
  );

  const [inputValue, setInputValue] = useState("");

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
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      const city = findCityByName(inputValue);
      if (city) {
        onSelect(city);
      }
    }
  };

  return (
    <div className="w-64">
      <Autocomplete
        aria-label="Select a city"
        placeholder="Search city..."
        onSelectionChange={handleSelectionChange}
        onInputChange={setInputValue}
        onKeyDown={handleKeyDown}
        size="sm"
        className="backdrop-blur-sm"
        menuTrigger="input"
      >
        {cities.map((city) => (
          <AutocompleteItem key={city.key} value={city.name} textValue={city.name}>
            {city.name}
          </AutocompleteItem>
        ))}
      </Autocomplete>
    </div>
  );
};

export default CitySelect;
