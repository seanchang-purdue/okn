import { atom } from "nanostores";
import type { InsightBlock, InsightState } from "../types/insight";
import { mapActionActions } from "./mapActionStore";

const initialState: InsightState = {
  blocks: [],
  loading: false,
  currentQuery: null,
};

export const insightState = atom<InsightState>(initialState);

/**
 * Layout containers (`section`, `row`) carry nested blocks under
 * `data.children`. Everything else is a leaf. Returns the child array for a
 * container, or `null` for a leaf block.
 */
const getChildren = (block: InsightBlock): InsightBlock[] | null => {
  if (block.type === "section" || block.type === "row") {
    return block.data.children;
  }
  return null;
};

/** Depth-first search for a block by id, descending into container children. */
const findBlock = (
  blocks: InsightBlock[],
  id: string
): InsightBlock | undefined => {
  for (const block of blocks) {
    if (block.id === id) return block;
    const children = getChildren(block);
    if (children) {
      const found = findBlock(children, id);
      if (found) return found;
    }
  }
  return undefined;
};

/**
 * Immutably rebuild a block tree, applying `partial` to the block whose id
 * matches. Recurses into container `data.children`. Untouched branches keep
 * their identity so unrelated subscribers don't churn.
 */
const updateInTree = (
  blocks: InsightBlock[],
  id: string,
  partial: Partial<InsightBlock>
): { blocks: InsightBlock[]; changed: boolean } => {
  let changed = false;
  const next = blocks.map((block) => {
    if (block.id === id) {
      changed = true;
      return { ...block, ...partial } as InsightBlock;
    }
    const children = getChildren(block);
    if (children) {
      const result = updateInTree(children, id, partial);
      if (result.changed) {
        changed = true;
        return {
          ...block,
          data: { ...block.data, children: result.blocks },
        } as InsightBlock;
      }
    }
    return block;
  });
  return changed ? { blocks: next, changed } : { blocks, changed };
};

/**
 * Walk a block (and its descendants, for containers) executing the map-action
 * side effect on every map-action block encountered. This is how map-action
 * blocks nested inside an emitted section/row get applied on emit.
 */
const executeMapActionsInTree = (block: InsightBlock): void => {
  if (block.type === "map-action") {
    mapActionActions.execute(block.data);
    return;
  }
  const children = getChildren(block);
  if (children) {
    children.forEach(executeMapActionsInTree);
  }
};

export const insightActions = {
  appendBlock: (block: InsightBlock) => {
    const current = insightState.get();
    insightState.set({
      ...current,
      blocks: [...current.blocks, block],
    });

    // Fire map-action side effects for the block itself AND any map-action
    // blocks nested inside an emitted section/row container.
    executeMapActionsInTree(block);
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

  /**
   * Tree-aware lookup: finds a block by id anywhere in the tree, including
   * blocks nested inside section/row containers.
   */
  getBlockById: (id: string): InsightBlock | undefined =>
    findBlock(insightState.get().blocks, id),

  /**
   * Tree-aware update: applies `partial` to the block with the given id
   * wherever it lives in the tree (top-level or nested in a section/row).
   * No-op if the id is not found.
   */
  updateBlockInTree: (id: string, partial: Partial<InsightBlock>) => {
    const current = insightState.get();
    const result = updateInTree(current.blocks, id, partial);
    if (!result.changed) return;
    insightState.set({
      ...current,
      blocks: result.blocks,
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
