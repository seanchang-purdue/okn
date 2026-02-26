// src/components/loaders/ThinkingDots.tsx
interface ThinkingDotsProps {
  size?: "sm" | "md" | "lg";
}

const ThinkingDots = ({ size = "md" }: ThinkingDotsProps) => {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  const dotSize = sizeClasses[size];

  return (
    <div className="flex items-center gap-1">
      <style>{`
        @keyframes bounce-dot {
          0%, 70%, 100% {
            transform: translateY(0);
            opacity: 0.3;
          }
          35% {
            transform: translateY(-4px);
            opacity: 0.8;
          }
        }
        .thinking-dot {
          animation: bounce-dot 1.6s ease-in-out infinite;
        }
        .thinking-dot:nth-child(1) {
          animation-delay: 0s;
        }
        .thinking-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .thinking-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
      `}</style>
      <div
        className={`thinking-dot ${dotSize} rounded-full bg-gray-400 dark:bg-gray-500`}
      />
      <div
        className={`thinking-dot ${dotSize} rounded-full bg-gray-400 dark:bg-gray-500`}
      />
      <div
        className={`thinking-dot ${dotSize} rounded-full bg-gray-400 dark:bg-gray-500`}
      />
    </div>
  );
};

export default ThinkingDots;
