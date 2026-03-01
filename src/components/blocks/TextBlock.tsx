import { memo, useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { marked, type Token } from "marked";
import type { InsightBlockMeta, TextBlockData, TextBlockRole } from "../../types/insight";
import "../../styles/markdown.css";
import InsightBlock from "./InsightBlock";

interface TextBlockProps {
  data: TextBlockData;
  streaming?: boolean;
  role?: TextBlockRole;
  meta?: InsightBlockMeta;
}

const getRoleTitle = (role?: TextBlockRole) => {
  if (role === "plan") return "Plan";
  if (role === "finding") return "Finding";
  if (role === "failure") return "Failure";
  return undefined;
};

const TextBlock = ({ data, streaming = false, role, meta }: TextBlockProps) => {
  const [html, setHtml] = useState("");
  const title = getRoleTitle(role);
  const confidence =
    typeof meta?.confidence === "number"
      ? `${Math.round(meta.confidence * 100)}% confidence`
      : undefined;
  const caveatText =
    Array.isArray(meta?.caveats) && meta.caveats.length > 0
      ? meta.caveats.join(" • ")
      : undefined;
  const metaText = [confidence, caveatText].filter(Boolean).join(" • ");

  useEffect(() => {
    let active = true;

    const renderMarkdown = async () => {
      const parsed = await marked.parse(data.markdown ?? "", {
        breaks: true,
        gfm: true,
        renderer: new marked.Renderer(),
        walkTokens: (token: Token) => {
          if (token.type === "heading") {
            token.depth = token.depth || 1;
          }
        },
      });
      if (!active) return;
      setHtml(DOMPurify.sanitize(parsed));
    };

    renderMarkdown();

    return () => {
      active = false;
    };
  }, [data.markdown]);

  return (
    <InsightBlock
      title={title}
      meta={metaText || undefined}
      className={
        role === "failure"
          ? "border-rose-300/70 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/20"
          : ""
      }
    >
      {html ? (
        <div
          className="markdown-content text-[13px] leading-[1.6] text-slate-800 dark:text-slate-100"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="whitespace-pre-wrap text-[13px] leading-[1.6] text-slate-800 dark:text-slate-100">
          {data.markdown && data.markdown.trim().length > 0
            ? data.markdown
            : streaming
              ? "Analyzing current context..."
              : ""}
        </p>
      )}

      {streaming && (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-blink rounded-sm bg-[var(--chat-accent)] align-text-bottom" />
      )}
    </InsightBlock>
  );
};

export default memo(TextBlock);
