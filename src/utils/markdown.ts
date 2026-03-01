/** Strip markdown syntax to plain text via regex. */
export function stripMarkdown(md: string): string {
  return (
    md
      // Remove headings
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic markers
      .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, "$2")
      // Remove strikethrough
      .replace(/~~(.*?)~~/g, "$1")
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove fenced code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove images
      .replace(/!\[.*?\]\(.*?\)/g, "")
      // Remove links, keep text
      .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Remove HTML tags
      .replace(/<[^>]+>/g, "")
      // Collapse whitespace
      .replace(/\n{2,}/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Extract the first heading from markdown. */
export function extractFirstHeading(md: string): string | undefined {
  const match = md.match(/^#{1,6}\s+(.+)$/m);
  return match ? match[1].trim() : undefined;
}

/** Truncate text with ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}
