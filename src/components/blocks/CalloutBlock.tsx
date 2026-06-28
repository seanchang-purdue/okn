"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { AlertTriangle, Info, Sparkles, type LucideIcon } from "lucide-react";
import type { CalloutBlockData, CalloutTone } from "../../types/insight";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "../../styles/markdown.css";

interface CalloutBlockProps {
  data: CalloutBlockData;
}

interface ToneStyle {
  icon: LucideIcon;
  label: string;
  /** Left accent rail color. */
  border: string;
  /** Icon / accent text color. */
  accent: string;
}

const TONES: Record<CalloutTone, ToneStyle> = {
  info: {
    icon: Info,
    label: "Info",
    border: "border-l-primary",
    accent: "text-primary",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    border: "border-l-amber-500",
    accent: "text-amber-600",
  },
  insight: {
    icon: Sparkles,
    label: "Insight",
    border: "border-l-emerald-500",
    accent: "text-emerald-600",
  },
};

const CalloutBlock = ({ data }: CalloutBlockProps) => {
  const tone = TONES[data.tone] ?? TONES.info;
  const markdown = data.markdown ?? "";
  const Icon = tone.icon;

  return (
    <Card
      className={cn("gap-2 border-l-4 bg-muted py-3 shadow-none", tone.border)}
      role="note"
    >
      <CardContent className="px-4">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4 shrink-0", tone.accent)} aria-hidden />
          {data.title ? (
            <p className="text-sm font-semibold text-foreground">{data.title}</p>
          ) : (
            <Badge variant="secondary">{tone.label}</Badge>
          )}
        </div>

        {markdown.trim().length > 0 && (
          <div className="markdown-content mt-1.5 text-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(CalloutBlock);
