// src/components/loaders/TypingIndicator.tsx

interface TypingIndicatorProps {
  message?: string;
}

const TypingIndicator = ({ message }: TypingIndicatorProps) => {
  return (
    <div className="py-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--chat-border)] bg-white/70 px-3 py-1.5 dark:bg-slate-900/60">
        <div className="flex items-center gap-1">
          <div className="chat-dot h-1.5 w-1.5 rounded-full bg-[var(--chat-accent)]" />
          <div className="chat-dot h-1.5 w-1.5 rounded-full bg-[var(--chat-accent)] [animation-delay:0.16s]" />
          <div className="chat-dot h-1.5 w-1.5 rounded-full bg-[var(--chat-accent)] [animation-delay:0.32s]" />
        </div>

        {message && (
          <span className="text-xs text-[var(--chat-muted)]">
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

export default TypingIndicator;
