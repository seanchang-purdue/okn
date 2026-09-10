import { type ReactNode } from "react";
import { PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chatLayoutActions } from "../../stores/chatLayoutStore";

interface ChatSidePanelProps {
  children: ReactNode;
}

/**
 * Desktop insight dock content.
 *
 * Sizing is owned by the parent shadcn <ResizablePanel> (ChatMapApp) — this is
 * now a plain full-height container that simply fills the panel. The bespoke
 * pointer/keyboard resize separator has been removed in favor of the
 * <ResizableHandle> the group renders between the map and this dock.
 *
 * Retained affordances: collapse button (-> setSidebarCollapsed(true)) and Esc.
 */
const ChatSidePanel = ({ children }: ChatSidePanelProps) => {
  return (
    <div
      id="okn-insight-panel"
      role="region"
      aria-label="AI insight panel"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          chatLayoutActions.setSidebarCollapsed(true);
        }
      }}
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden border-l border-border bg-card"
      )}
    >
      {/* Title bar with collapse control */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border pl-4 pr-2">
        <span className="text-xs font-medium text-muted-foreground">
          Insights
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => chatLayoutActions.setSidebarCollapsed(true)}
          aria-label="Collapse panel"
          aria-controls="okn-insight-panel"
        >
          <PanelRightClose className="size-4" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default ChatSidePanel;
