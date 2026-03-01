import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useStore } from "@nanostores/react";
import {
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  chatLayoutActions,
  sidebarWidthStore,
} from "../../stores/chatLayoutStore";

interface ChatSidePanelProps {
  children: ReactNode;
}

const ChatSidePanel = ({ children }: ChatSidePanelProps) => {
  const sidebarWidth = useStore(sidebarWidthStore);
  const [isMobile, setIsMobile] = useState(false);
  const [sheetOffset, setSheetOffset] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const resizeOriginRef = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setSheetOffset(0);
      return;
    }
    setSheetOffset(0);
  }, [isMobile]);

  useEffect(() => {
    if (!isResizing || !resizeOriginRef.current) return;

    const onMouseMove = (event: globalThis.MouseEvent) => {
      if (!resizeOriginRef.current) return;
      const delta = resizeOriginRef.current.x - event.clientX;
      const nextWidth = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, resizeOriginRef.current.width + delta)
      );
      chatLayoutActions.setSidebarWidth(nextWidth);
    };

    const onMouseUp = () => {
      resizeOriginRef.current = null;
      setIsResizing(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeOriginRef.current = {
      x: event.clientX,
      width: sidebarWidth,
    };
    setIsResizing(true);
  };

  return (
    <motion.div
      className={`fixed z-40 flex flex-col border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
        isMobile
          ? "left-0 right-0 bottom-0 h-[78vh] rounded-t-xl border-t"
          : "top-0 right-0 bottom-0 border-l"
      }`}
      style={isMobile ? undefined : { width: sidebarWidth }}
      initial={isMobile ? { y: "100%" } : { x: sidebarWidth }}
      animate={isMobile ? { y: sheetOffset } : { x: 0 }}
      exit={isMobile ? { y: "100%" } : { x: sidebarWidth }}
      transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      drag={isMobile ? "y" : false}
      dragConstraints={{ top: 0, bottom: 260 }}
      dragElastic={0.08}
      onDragEnd={(_event, info) => {
        if (!isMobile) return;
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
      {isMobile && (
        <div className="flex justify-center border-b border-slate-200 bg-white py-2 dark:border-slate-700 dark:bg-slate-900">
          <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
      )}

      {!isMobile && (
        <div
          role="presentation"
          onMouseDown={handleResizeStart}
          className={`absolute left-0 top-0 z-20 h-full w-1 -translate-x-1/2 cursor-col-resize ${
            isResizing
              ? "bg-[var(--chat-accent)]/30"
              : "bg-transparent hover:bg-[var(--chat-accent)]/20"
          }`}
        />
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
};

export default ChatSidePanel;
