import { persistentAtom } from "@nanostores/persistent";
import { atom } from "nanostores";

export type DesktopChatMode = "sidebar" | "floating";
export type ChatMode = DesktopChatMode | "sheet";
export type FloatingDockEdge = "left" | "right" | "top" | "bottom";
export const SIDEBAR_MIN_WIDTH = 380;
export const SIDEBAR_MAX_WIDTH = 720;

const normalizeSidebarWidth = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 460;
  }
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(value)));
};

const normalizeDesktopMode = (value: unknown): DesktopChatMode =>
  value === "floating" ? "floating" : "sidebar";

const normalizeChatMode = (value: unknown): ChatMode => {
  if (value === "sheet") return "sheet";
  if (value === "floating") return "floating";
  return "sidebar";
};

export const desktopChatModeStore = persistentAtom<DesktopChatMode>(
  "chatDesktopMode",
  "sidebar",
  {
    encode: JSON.stringify,
    decode: (raw) => {
      try {
        return normalizeDesktopMode(JSON.parse(raw));
      } catch {
        return "sidebar";
      }
    },
  }
);

export const chatModeStore = persistentAtom<ChatMode>("chatMode", "sidebar", {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      return normalizeChatMode(JSON.parse(raw));
    } catch {
      return "sidebar";
    }
  },
});

export const floatingPositionStore = atom({ x: 0, y: 0 });

export const floatingDimensionsStore = atom({ width: 460, height: 620 });

export const floatingDockEdgeStore = atom<FloatingDockEdge>("right");

export const sidebarWidthStore = persistentAtom<number>("chatSidebarWidth", 460, {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      return normalizeSidebarWidth(JSON.parse(raw));
    } catch {
      return 460;
    }
  },
});

const setDesktopMode = (mode: DesktopChatMode) => {
  desktopChatModeStore.set(mode);
  if (chatModeStore.get() !== "sheet") {
    chatModeStore.set(mode);
  }
};

export type QueryMode = "auto" | "research";

export const queryModeStore = persistentAtom<QueryMode>(
  "okn:queryMode",
  "auto",
  { encode: JSON.stringify, decode: (raw) => {
    try {
      const parsed = JSON.parse(raw);
      return parsed === "research" ? "research" : "auto";
    } catch {
      return "auto";
    }
  }}
);

export const chatLayoutActions = {
  openFloating: () => setDesktopMode("floating"),
  openSidebar: () => setDesktopMode("sidebar"),
  toggleFloatingSidebar: () => {
    const currentDesktopMode = desktopChatModeStore.get();
    setDesktopMode(currentDesktopMode === "floating" ? "sidebar" : "floating");
  },
  syncViewportMode: (isMobile: boolean) => {
    if (isMobile) {
      chatModeStore.set("sheet");
      return;
    }
    chatModeStore.set(desktopChatModeStore.get());
  },
  setSidebarWidth: (width: number) => {
    sidebarWidthStore.set(normalizeSidebarWidth(width));
  },
  setQueryMode: (mode: QueryMode) => queryModeStore.set(mode),
};
