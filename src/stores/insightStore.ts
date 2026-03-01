import { atom } from "nanostores";
import type { InsightBlock, InsightState } from "../types/insight";
import { mapActionActions } from "./mapActionStore";

const initialState: InsightState = {
  blocks: [],
  loading: false,
  currentQuery: null,
};

export const insightState = atom<InsightState>(initialState);

export const insightActions = {
  appendBlock: (block: InsightBlock) => {
    const current = insightState.get();
    insightState.set({
      ...current,
      blocks: [...current.blocks, block],
    });

    if (block.type === "map-action") {
      mapActionActions.execute(block.data);
    }
  },

  updateBlock: (id: string, partial: Partial<InsightBlock>) => {
    const current = insightState.get();
    insightState.set({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === id ? ({ ...block, ...partial } as InsightBlock) : block
      ),
    });
  },

  clearBlocks: () => {
    insightState.set({
      ...initialState,
    });
  },

  removeBlock: (id: string) => {
    const current = insightState.get();
    insightState.set({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== id),
    });
  },

  setLoading: (loading: boolean) => {
    const current = insightState.get();
    insightState.set({
      ...current,
      loading,
    });
  },

  setCurrentQuery: (query: string | null) => {
    const current = insightState.get();
    insightState.set({
      ...current,
      currentQuery: query,
    });
  },
};
