import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

interface ChatSidePanelProps {
  children: ReactNode;
}

const ChatSidePanel = ({ children }: ChatSidePanelProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sheetOffset, setSheetOffset] = useState(0);

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

  return (
    <motion.div
      className={`fixed z-40 flex flex-col border-line-1 bg-surface-1 ${
        isMobile
          ? "left-0 right-0 bottom-0 h-[78vh] rounded-t-xl border-t shadow-sm"
          : "left-4 top-4 w-[408px] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl border shadow-lg"
      }`}
      initial={isMobile ? { y: "100%" } : { x: -440, opacity: 0 }}
      animate={isMobile ? { y: sheetOffset } : { x: 0, opacity: 1 }}
      exit={isMobile ? { y: "100%" } : { x: -440, opacity: 0 }}
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
        <div className="flex justify-center border-b border-line-1 bg-surface-1 py-2">
          <span className="h-1.5 w-12 rounded-full bg-line-1" />
        </div>
      )}

      <div
        className={
          isMobile
            ? "min-h-0 flex-1 overflow-hidden"
            : "flex min-h-0 flex-col overflow-hidden"
        }
      >
        {children}
      </div>
    </motion.div>
  );
};

export default ChatSidePanel;
