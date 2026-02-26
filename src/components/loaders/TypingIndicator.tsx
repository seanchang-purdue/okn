// src/components/loaders/TypingIndicator.tsx

interface TypingIndicatorProps {
  message?: string;
}

const TypingIndicator = ({ message }: TypingIndicatorProps) => {
  return (
    <div className="py-3">
      <div className="flex items-center gap-2">
        {/* Animated dots */}
        <div className="flex items-center gap-1">
          <style>{`
            @keyframes pulse-dot {
              0%, 100% { opacity: 0.3; transform: scale(0.85); }
              50% { opacity: 1; transform: scale(1); }
            }
            .typing-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
            .typing-dot:nth-child(1) { animation-delay: 0s; }
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
          `}</style>
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-blue-500" />
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-blue-500" />
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-blue-500" />
        </div>

        {/* Optional message */}
        {message && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

export default TypingIndicator;
