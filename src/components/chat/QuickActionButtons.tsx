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
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">
        Related questions
      </p>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onActionClick(action.query)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-xs opacity-75">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionButtons;
