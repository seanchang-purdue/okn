import { atom } from "nanostores";
import type { InsightBlock } from "../types/insight";

interface ArtifactModalState {
  isOpen: boolean;
  block: InsightBlock | null;
}

export const artifactModalState = atom<ArtifactModalState>({
  isOpen: false,
  block: null,
});

export const artifactModalActions = {
  open: (block: InsightBlock) => {
    artifactModalState.set({ isOpen: true, block });
  },
  close: () => {
    artifactModalState.set({ isOpen: false, block: null });
  },
};
