"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { CalloutBlockData, CalloutTone } from "../../types/insight";
import "../../styles/markdown.css";

interface CalloutBlockProps {
  data: CalloutBlockData;
}

interface ToneStyle {
  /** Left accent rail + heading color. */
  accent: string;
  /** Tinted background. */
  bg: string;
  /** Border color. */
  border: string;
  icon: string;
  label: string;
}

const TONES: Record<CalloutTone, ToneStyle> = {
  info: {
    accent: "var(--accent)",
    bg: "color-mix(in srgb, var(--accent) 8%, var(--surface-1))",
    border: "color-mix(in srgb, var(--accent) 30%, var(--line-1))",
    icon: "ℹ",
    label: "Info",
  },
  warning: {
    accent: "var(--warn)",
    bg: "color-mix(in srgb, var(--warn) 10%, var(--surface-1))",
    border: "color-mix(in srgb, var(--warn) 32%, var(--line-1))",
    icon: "⚠",
    label: "Warning",
  },
  insight: {
    accent: "var(--positive)",
    bg: "color-mix(in srgb, var(--positive) 9%, var(--surface-1))",
    border: "color-mix(in srgb, var(--positive) 30%, var(--line-1))",
    icon: "✦",
    label: "Insight",
  },
};

const CalloutBlock = ({ data }: CalloutBlockProps) => {
  const tone = TONES[data.tone] ?? TONES.info;
  const markdown = data.markdown ?? "";

  return (
    <div
      className="animate-chat-fade-in rounded-lg border px-4 py-3"
      style={{
        backgroundColor: tone.bg,
        borderColor: tone.border,
        borderLeftWidth: 3,
        borderLeftColor: tone.accent,
      }}
      role="note"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden style={{ color: tone.accent }} className="text-body leading-none">
          {tone.icon}
        </span>
        {data.title ? (
          <p className="text-body font-semibold text-ink-1">{data.title}</p>
        ) : (
          <p
            className="text-label"
            style={{ color: tone.accent }}
          >
            {tone.label}
          </p>
        )}
      </div>

      {markdown.trim().length > 0 && (
        <div className="markdown-content mt-1.5 text-ink-1">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default memo(CalloutBlock);
