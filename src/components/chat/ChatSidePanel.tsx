import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useStore } from "@nanostores/react";
import {
  chatLayoutActions,
  sidebarWidthStore,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
} from "../../stores/chatLayoutStore";

interface ChatSidePanelProps {
  children: ReactNode;
}

const RESET_WIDTH = 460;
const KEYBOARD_STEP = 16;

const ChatSidePanel = ({ children }: ChatSidePanelProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sheetOffset, setSheetOffset] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const sidebarWidth = useStore(sidebarWidthStore);
  const draggingRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setSheetOffset(0);
  }, [isMobile]);

  // ---- Resize separator (desktop) -------------------------------------------
  // The panel is docked on the RIGHT; the handle sits on its LEFT edge. The new
  // width is the distance from the pointer to the viewport's right edge. The
  // store clamps to [SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH].
  const setWidthFromClientX = (clientX: number) => {
    chatLayoutActions.setSidebarWidth(window.innerWidth - clientX);
  };

  const handleSeparatorPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    draggingRef.current = true;
    chatLayoutActions.setSidebarResizing(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleSeparatorPointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!draggingRef.current) return;
    setWidthFromClientX(event.clientX);
  };

  const handleSeparatorPointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    chatLayoutActions.setSidebarResizing(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleSeparatorKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    // Handle on the left edge: ArrowLeft widens (boundary moves left),
    // ArrowRight narrows. The store clamps the result.
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      chatLayoutActions.setSidebarWidth(sidebarWidth + KEYBOARD_STEP);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      chatLayoutActions.setSidebarWidth(sidebarWidth - KEYBOARD_STEP);
    }
  };

  // ---- Mobile bottom sheet (unchanged behavior) -----------------------------
  if (isMobile) {
    return (
      <motion.div
        className="fixed left-0 right-0 bottom-0 z-40 flex h-[78vh] flex-col rounded-t-xl border-t border-line-1 bg-surface-1 shadow-sm"
        initial={prefersReducedMotion ? { opacity: 0 } : { y: "100%" }}
        animate={
          prefersReducedMotion
            ? { opacity: 1, y: sheetOffset }
            : { y: sheetOffset }
        }
        exit={prefersReducedMotion ? { opacity: 0 } : { y: "100%" }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 260 }}
        dragElastic={prefersReducedMotion ? 0 : 0.08}
        onDragEnd={(_event, info) => {
          if (info.offset.y < -80 || info.velocity.y < -700) {
            setSheetOffset(0);
            return;
          }
          if (info.offset.y > 140 || info.velocity.y > 700) {
            setSheetOffset(260);
            return;
          }
          setSheetOffset(0);
        }}
      >
        <div className="flex justify-center border-b border-line-1 bg-surface-1 py-2">
          <span className="h-1.5 w-12 rounded-full bg-line-1" />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </motion.div>
    );
  }

  // ---- Desktop docked column ------------------------------------------------
  return (
    <motion.div
      id="okn-insight-panel"
      role="region"
      aria-label="AI insight panel"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          chatLayoutActions.setSidebarCollapsed(true);
        }
      }}
      className="relative flex h-full w-full flex-col overflow-hidden border-l border-line-1 bg-surface-1"
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: "easeOut" }}
    >
      {/* Resize separator — 6px handle on the LEFT edge */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        aria-valuenow={sidebarWidth}
        aria-valuemin={SIDEBAR_MIN_WIDTH}
        aria-valuemax={SIDEBAR_MAX_WIDTH}
        tabIndex={0}
        onPointerDown={handleSeparatorPointerDown}
        onPointerMove={handleSeparatorPointerMove}
        onPointerUp={handleSeparatorPointerUp}
        onLostPointerCapture={() => {
          draggingRef.current = false;
          chatLayoutActions.setSidebarResizing(false);
        }}
        onKeyDown={handleSeparatorKeyDown}
        onDoubleClick={() => chatLayoutActions.setSidebarWidth(RESET_WIDTH)}
        className="absolute inset-y-0 left-0 z-20 w-1.5 cursor-col-resize touch-none select-none transition-colors hover:bg-accent/30 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent before:absolute before:inset-y-0 before:-left-1 before:-right-1 before:content-['']"
      />

      {/* Panel title bar with collapse control */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-line-1 pl-4 pr-2">
        <span className="text-label text-ink-3">Insights</span>
        <button
          type="button"
          onClick={() => chatLayoutActions.setSidebarCollapsed(true)}
          className="apple-notion-icon-btn"
          aria-label="Collapse panel"
          aria-controls="okn-insight-panel"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
};

export default ChatSidePanel;
