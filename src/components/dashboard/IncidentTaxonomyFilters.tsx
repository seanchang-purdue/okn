import { TAXONOMY_DEFINITIONS } from "../../utils/map/taxonomy";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface IncidentTaxonomyFiltersProps {
  selected: string[];
  onChange: (next: string[]) => void;
  counts?: Record<string, number>;
  embedded?: boolean;
}

const IncidentTaxonomyFilters = ({
  selected,
  onChange,
  counts,
  embedded = false,
}: IncidentTaxonomyFiltersProps) => {
  const normalize = (values: string[]) =>
    Array.from(new Set(values.map((item) => item.trim()).filter(Boolean))).sort();

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(normalize(selected.filter((item) => item !== key)));
      return;
    }
    onChange(normalize([...selected, key]));
  };

  const body = (
    <>
      <div className="flex flex-wrap gap-2">
        {TAXONOMY_DEFINITIONS.map((item) => {
          const active = selected.includes(item.key);
          const count = counts?.[item.key] ?? 0;

          return (
            <Button
              key={item.key}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => toggle(item.key)}
              className="rounded-full"
              title={item.hint}
            >
              <span>{item.label}</span>
              <Badge
                variant={active ? "secondary" : "outline"}
                className="ml-1 px-1.5 text-[10px]"
              >
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Multiple selections apply as intersection.
      </p>
    </>
  );

  if (embedded) {
    return <div>{body}</div>;
  }

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Incident Taxonomy
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">{body}</CardContent>
    </Card>
  );
};

export default IncidentTaxonomyFilters;
