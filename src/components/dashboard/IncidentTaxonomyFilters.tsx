import { TAXONOMY_DEFINITIONS } from "../../utils/map/taxonomy";

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

  return (
    <section
      className={
        embedded
          ? ""
          : "rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-panel)] p-3"
      }
    >
      {!embedded && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--chat-muted)]">
          Incident Taxonomy
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {TAXONOMY_DEFINITIONS.map((item) => {
          const active = selected.includes(item.key);
          const count = counts?.[item.key] ?? 0;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => toggle(item.key)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "border-[var(--chat-accent)] bg-[var(--chat-accent-soft)] text-[var(--chat-accent)]"
                  : "border-[var(--chat-border)] bg-[var(--apple-notion-pill)] text-[var(--chat-muted)] hover:border-[var(--chat-accent)]/60"
              }`}
              title={item.hint}
            >
              <span>{item.label}</span>
              <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-[var(--chat-muted)]">
        Multiple selections apply as intersection.
      </p>
    </section>
  );
};

export default IncidentTaxonomyFilters;
