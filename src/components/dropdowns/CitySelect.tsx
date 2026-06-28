import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CITIES } from "../../config/cities";

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
  const cities: City[] = CITIES.map((c) => ({
    key: c.key,
    name: c.name,
    center: c.center,
    zoom: c.zoom,
  }));

  const handleValueChange = (key: string) => {
    const city = cities.find((c) => c.key === key);
    if (city) {
      onSelect(city);
    }
  };

  return (
    <div className="w-64">
      <Select onValueChange={handleValueChange}>
        <SelectTrigger aria-label="Select a city" className="w-full">
          <SelectValue placeholder="Search city..." />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.key} value={city.key}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CitySelect;
