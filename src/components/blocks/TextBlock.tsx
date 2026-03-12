import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
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

const MarkdownContent = memo(({ markdown, streaming }: {
  markdown: string;
  streaming: boolean;
}) => (
  <>
    {markdown.trim().length > 0 ? (
      <div className="markdown-content text-[13px] leading-[1.6] text-slate-800 dark:text-slate-100">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    ) : (
      <p className="whitespace-pre-wrap text-[13px] leading-[1.6] text-slate-800 dark:text-slate-100">
        {streaming ? "Analyzing current context..." : ""}
      </p>
    )}

    {streaming && (
      <span className="ml-0.5 inline-block h-4 w-0.5 animate-blink rounded-sm bg-[var(--chat-accent)] align-text-bottom" />
    )}
  </>
));
MarkdownContent.displayName = "MarkdownContent";

const TextBlock = ({ data, streaming = false, role, meta }: TextBlockProps) => {
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

  const content = (
    <MarkdownContent markdown={data.markdown ?? ""} streaming={streaming} />
  );

  // Regular streamed text (no role) renders without the card/bubble wrapper
  if (!role) {
    return <div className="animate-chat-fade-in py-1">{content}</div>;
  }

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
      {content}
    </InsightBlock>
  );
};

export default memo(TextBlock);
