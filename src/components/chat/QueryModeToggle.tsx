import { useStore } from "@nanostores/react";
import { queryModeStore, chatLayoutActions } from "../../stores/chatLayoutStore";

const QueryModeToggle = () => {
  const mode = useStore(queryModeStore);

  return (
    <div
      role="group"
      aria-label="Query mode"
      className="inline-flex items-center rounded-lg border border-[var(--chat-border,theme(colors.slate.200))] bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800"
    >
      <button
        type="button"
        onClick={() => chatLayoutActions.setQueryMode("auto")}
        aria-pressed={mode === "auto"}
        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
          mode === "auto"
            ? "bg-white text-[var(--chat-accent,theme(colors.blue.600))] shadow-sm dark:bg-slate-700 dark:text-blue-400"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <span aria-hidden>⚡</span>
        Auto
      </button>
      <button
        type="button"
        onClick={() => chatLayoutActions.setQueryMode("research")}
        aria-pressed={mode === "research"}
        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
          mode === "research"
            ? "bg-white text-[var(--chat-accent,theme(colors.blue.600))] shadow-sm dark:bg-slate-700 dark:text-blue-400"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <span aria-hidden>🔬</span>
        Research
      </button>
    </div>
  );
};

export default QueryModeToggle;
