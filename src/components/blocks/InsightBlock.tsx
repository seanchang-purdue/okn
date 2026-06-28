import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InsightBlockProps {
  children: ReactNode;
  title?: string;
  meta?: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const InsightBlock = ({
  children,
  title,
  meta,
  className = "",
  collapsible = false,
  defaultCollapsed = false,
}: InsightBlockProps) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const hasHeader = Boolean(title || meta || collapsible);

  return (
    <Card className={cn("gap-3 py-3", className)}>
      {hasHeader && (
        <CardHeader className="px-4">
          <div className="space-y-0.5">
            {title && <CardTitle className="text-sm">{title}</CardTitle>}
            {meta && (
              <CardDescription className="text-xs">{meta}</CardDescription>
            )}
          </div>

          {collapsible && (
            <CardAction>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={collapsed ? "Expand block" : "Collapse block"}
              >
                {collapsed ? "Show" : "Hide"}
              </Button>
            </CardAction>
          )}
        </CardHeader>
      )}

      {!collapsed && <CardContent className="px-4">{children}</CardContent>}
    </Card>
  );
};

export default InsightBlock;
