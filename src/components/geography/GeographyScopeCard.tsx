import { Button } from "@/components/ui/button";

interface GeographyScopeCardProps {
  label: string;
  type: string;
  onClear: () => void;
}

const GeographyScopeCard = ({ label, type, onClear }: GeographyScopeCardProps) => {
  return (
    <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-card-foreground">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">Scope: {type || "location"}</p>
      </div>
      <Button variant="outline" size="xs" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
};

export default GeographyScopeCard;
