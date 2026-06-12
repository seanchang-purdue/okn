import { useStore } from "@nanostores/react";
import { queryModeStore, chatLayoutActions } from "../../stores/chatLayoutStore";

const BoltIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11 2.5 4.5 11.5h4L9 17.5l6.5-9h-4l-.5-6Z" />
  </svg>
);

const FlaskIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 2.5h4M8.75 2.5v4.9l-4.3 7.4a1.8 1.8 0 0 0 1.55 2.7h8a1.8 1.8 0 0 0 1.55-2.7l-4.3-7.4V2.5" />
  </svg>
);

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
        <BoltIcon />
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
        <FlaskIcon />
        Research
      </button>
    </div>
  );
};

export default QueryModeToggle;
