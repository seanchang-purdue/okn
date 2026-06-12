import type { ReactNode } from "react";

export type BlockTypeKey = "text" | "chart" | "table" | "comparison" | "map";

interface BlockTypeIconProps {
  type: BlockTypeKey;
  className?: string;
}

const paths: Record<BlockTypeKey, ReactNode> = {
  // Document outline with two lines
  text: (
    <>
      <path d="M5.5 2.5H11l3.5 3.5v11.5h-9v-15Z" />
      <path d="M11 2.5V6h3.5" />
      <path d="M8 10h4M8 13h4" />
    </>
  ),
  // Three vertical bars
  chart: <path d="M4.5 16.5v-5M10 16.5v-9M15.5 16.5v-12" />,
  // Grid with header row
  table: (
    <>
      <rect x="3.5" y="4.5" width="13" height="11" rx="1" />
      <path d="M3.5 8h13M8 8v7.5M12.5 8v7.5" />
    </>
  ),
  // Two columns with center divider
  comparison: (
    <>
      <rect x="3" y="5" width="5" height="10" rx="1" />
      <rect x="12" y="5" width="5" height="10" rx="1" />
      <path d="M10 3.5v13" />
    </>
  ),
  // Location pin
  map: (
    <>
      <path d="M10 17.5c-3-2.8-5.5-5.6-5.5-8.5a5.5 5.5 0 1 1 11 0c0 2.9-2.5 5.7-5.5 8.5Z" />
      <circle cx="10" cy="8.5" r="2" />
    </>
  ),
};

export const BlockTypeIcon = ({ type, className }: BlockTypeIconProps) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {paths[type]}
  </svg>
);

export default BlockTypeIcon;
