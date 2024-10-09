import { persistentAtom } from "@nanostores/persistent";

export const isDarkmode = persistentAtom<boolean>("isDarkmode", false, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const toggleDarkmode = () => {
  isDarkmode.set(!isDarkmode.get());
};
