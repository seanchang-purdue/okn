import { persistentAtom } from "@nanostores/persistent";

export const selectedCensusBlocks = persistentAtom<number[]>(
  "selectedCensusBlocks",
  [],
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);
