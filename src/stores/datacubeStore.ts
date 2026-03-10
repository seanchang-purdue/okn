// src/stores/datacubeStore.ts
import { atom } from "nanostores";
import type {
  DatacubeSchemaResponse,
  DatacubeQueryResponse,
  DisplayMode,
  ActiveFilter,
} from "../types/datacube";

// Schema fetched once on mount
export const schemaStore = atom<DatacubeSchemaResponse | null>(null);

// Current query configuration
export const rowDimsStore = atom<string[]>([]);
export const colDimsStore = atom<string[]>([]);
export const aggregationStore = atom<string>("");
export const activeFiltersStore = atom<ActiveFilter[]>([]);

// Results from last query
export const resultsStore = atom<DatacubeQueryResponse | null>(null);

// UI state
export const loadingStore = atom<boolean>(false);
export const errorStore = atom<string | null>(null);
export const displayModeStore = atom<DisplayMode>("table");
// null = auto-detect, set to value when user manually picks
export const lockedModeStore = atom<DisplayMode | null>(null);
