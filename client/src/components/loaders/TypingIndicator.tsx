// src/components/loaders/TypingIndicator.tsx
import OknBotIcon from "../../icons/okn-bot.svg";
import ThinkingDots from "./ThinkingDots";

interface TypingIndicatorProps {
  message?: string;
}

const TypingIndicator = ({ message }: TypingIndicatorProps) => {
  return (
    <div className="py-4">
      <div className="flex gap-3 items-start">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          <img
            src={OknBotIcon.src}
            alt="OKN Bot"
            className="w-7 h-7 rounded-full"
          />
        </div>

        {/* Typing content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              OKN Bot
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <ThinkingDots size="sm" />
            {message && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;