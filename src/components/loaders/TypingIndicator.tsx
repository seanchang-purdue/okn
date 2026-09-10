// src/components/loaders/TypingIndicator.tsx

interface TypingIndicatorProps {
  message?: string;
}

const TypingIndicator = ({ message }: TypingIndicatorProps) => {
  return (
    <div className="py-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
        <div className="flex items-center gap-1">
          <div className="chat-dot h-1.5 w-1.5 rounded-full bg-primary" />
          <div className="chat-dot h-1.5 w-1.5 rounded-full bg-primary [animation-delay:0.16s]" />
          <div className="chat-dot h-1.5 w-1.5 rounded-full bg-primary [animation-delay:0.32s]" />
        </div>

        {message && (
          <span className="text-xs text-muted-foreground">
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

export default TypingIndicator;
