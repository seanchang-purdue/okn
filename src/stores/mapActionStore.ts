import { atom } from "nanostores";
import type { MapActionBlockData } from "../types/insight";

export type MapActionExecutor = (action: MapActionBlockData) => void;

export const mapActionExecutorStore = atom<MapActionExecutor | null>(null);

export const mapActionActions = {
  registerExecutor: (executor: MapActionExecutor) => {
    mapActionExecutorStore.set(executor);
  },

  clearExecutor: () => {
    mapActionExecutorStore.set(null);
  },

  execute: (action: MapActionBlockData) => {
    const executor = mapActionExecutorStore.get();
    if (!executor) return;
    executor(action);
  },
};
