"use client";

import { useEffect } from "react";
import { isDarkmode } from "../../stores/darkmodeStore";

function updateDarkMode() {
  if (isDarkmode.get()) {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
  } else {
    document.body.classList.add("light");
    document.body.classList.remove("dark");
  }
}

export default function DarkmodeInitializer() {
  useEffect(() => {
    updateDarkMode();
    const unsubscribe = isDarkmode.subscribe(updateDarkMode);
    return () => unsubscribe();
  }, []);

  return null;
}
