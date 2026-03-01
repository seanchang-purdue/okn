import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import { useStore } from "@nanostores/react";
import { floatingDimensionsStore } from "../../stores/chatLayoutStore";

interface FloatingChatWindowProps {
  children: ReactNode;
}

const BASE_RIGHT_OFFSET = 24;
const BASE_BOTTOM_OFFSET = 24;

const FloatingChatWindow = ({ children }: FloatingChatWindowProps) => {
  const dimensions = useStore(floatingDimensionsStore);
  const [isMobile, setIsMobile] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeOriginRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isResizing || !resizeOriginRef.current) return;

    const MIN_WIDTH = 420;
    const MAX_WIDTH = 640;
    const MIN_HEIGHT = 520;
    const MAX_HEIGHT = 820;

    const onMouseMove = (event: globalThis.MouseEvent) => {
      if (!resizeOriginRef.current) return;
      // Handle is top-left; dragging left/up increases dimensions
      const nextWidth = Math.max(
        MIN_WIDTH,
        Math.min(
          MAX_WIDTH,
          resizeOriginRef.current.width - (event.clientX - resizeOriginRef.current.x)
        )
      );
      const nextHeight = Math.max(
        MIN_HEIGHT,
        Math.min(
          MAX_HEIGHT,
          resizeOriginRef.current.height - (event.clientY - resizeOriginRef.current.y)
        )
      );
      floatingDimensionsStore.set({ width: nextWidth, height: nextHeight });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      resizeOriginRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeOriginRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: dimensions.width,
      height: dimensions.height,
    };
    setIsResizing(true);
  };

  return (
    <motion.div
      className={`fixed z-50 flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
        isMobile
          ? "left-3 right-3 top-20 bottom-3 rounded-xl"
          : "rounded-xl"
      }`}
      style={
        isMobile
          ? undefined
          : {
              width: dimensions.width,
              height: dimensions.height,
              right: BASE_RIGHT_OFFSET,
              bottom: BASE_BOTTOM_OFFSET,
            }
      }
      initial={isMobile ? { opacity: 0, y: 16 } : { opacity: 0, scale: 0.985, y: 10 }}
      animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
      exit={isMobile ? { opacity: 0, y: 10 } : { opacity: 0, scale: 0.985, y: 10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        {children}
      </div>

      {!isMobile && (
        <div
          role="presentation"
          onMouseDown={handleResizeStart}
          className="absolute top-0 left-0 z-10 h-4 w-4 cursor-nw-resize"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4 text-slate-400 dark:text-slate-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M10 2L2 10M2 6l4-4M6 2H2v4" />
          </svg>
        </div>
      )}
    </motion.div>
  );
};

export default FloatingChatWindow;
