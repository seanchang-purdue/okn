import { Button, Tooltip } from "@heroui/react";

interface ShareButtonProps {
  onPress: () => void;
  compact?: boolean;
}

const ShareButton = ({ onPress, compact = true }: ShareButtonProps) => {
  return (
    <Tooltip content="Share current view" placement="bottom">
      <Button
        onPress={onPress}
        color="primary"
        variant={compact ? "flat" : "solid"}
        isIconOnly={compact}
        size="sm"
        aria-label="Share current view"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M15 8a3 3 0 10-2.83-4H12a3 3 0 00.17 1L8.91 6.63a3 3 0 100 2.74l3.26 1.63A3 3 0 0012 12a3 3 0 10.17 1h.01a3 3 0 00-.17-1l-3.26-1.63a3 3 0 000-2.74L12.01 6A3 3 0 0015 8z" />
        </svg>
        {!compact && "Share"}
      </Button>
    </Tooltip>
  );
};

export default ShareButton;
