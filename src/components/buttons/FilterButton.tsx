import { Button } from "@heroui/react";

interface FilterButtonProps {
  onToggle: () => void;
  isActive?: boolean;
}

const FilterButton = ({ onToggle, isActive = false }: FilterButtonProps) => {
  return (
    <Button
      isIconOnly
      onPress={onToggle}
      variant="light"
      className={`h-9 w-9 min-w-0 rounded-full border transition-colors ${
        isActive
          ? "border-[var(--chat-accent)] bg-[var(--chat-accent-soft)] text-[var(--chat-accent)]"
          : "border-[var(--chat-border)] bg-[color:var(--chat-panel-strong)] text-[var(--chat-title)] hover:border-[var(--chat-accent)] hover:text-[var(--chat-accent)]"
      }`}
      aria-label={isActive ? "Close filters" : "Open filters"}
      title={isActive ? "Close filters" : "Open filters"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className="h-4.5 w-4.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6h16M7 12h10M10 18h4"
        />
      </svg>
    </Button>
  );
};

export default FilterButton;
