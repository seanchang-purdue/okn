// src/components/chat/QuickActionButtons.tsx
import type { QuickAction } from "../../types/chat";

interface QuickActionButtonsProps {
  actions: QuickAction[];
  onActionClick: (query: string) => void;
  disabled?: boolean;
}

const QuickActionButtons = ({
  actions,
  onActionClick,
  disabled = false,
}: QuickActionButtonsProps) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onActionClick(action.query)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 shadow-sm hover:shadow-md"
            aria-label={action.label}
          >
            <span className="text-sm">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionButtons;
