import { persistentAtom } from "@nanostores/persistent";

export const selectedCensusBlocks = persistentAtom<string[]>(
  "selectedCensusBlocks",
  [],
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);
