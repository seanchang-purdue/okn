interface GeographyScopeCardProps {
  label: string;
  type: string;
  onClear: () => void;
}

const GeographyScopeCard = ({ label, type, onClear }: GeographyScopeCardProps) => {
  return (
    <div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl border border-[var(--chat-border)] bg-[color:var(--chat-panel-strong)] px-2.5 py-1.5 text-[11px]">
      <div className="min-w-0">
        <p className="truncate font-medium text-[var(--chat-title)] dark:text-slate-100">{label}</p>
        <p className="text-[var(--chat-muted)]">Scope: {type || "location"}</p>
      </div>
      <button
        onClick={onClear}
        className="rounded-md border border-[var(--chat-border)] px-2 py-1 text-[10px] font-medium text-[var(--chat-muted)] hover:border-[var(--chat-accent)] hover:text-[var(--chat-accent)]"
      >
        Clear
      </button>
    </div>
  );
};

export default GeographyScopeCard;
