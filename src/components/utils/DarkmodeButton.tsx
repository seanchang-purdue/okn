import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { isDarkmode, toggleDarkmode } from "../../stores/darkmodeStore.ts";
import MaterialSunIcon from "../../icons/material-sun.tsx";
import MaterialMoonIcon from "../../icons/material-moon.tsx";

const DarkmodeButton = () => {
  const [darkMode, setDarkMode] = useState(isDarkmode.get());

  useEffect(() => {
    const unsubscribe = isDarkmode.subscribe((value) => {
      setDarkMode(value);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Button isIconOnly onClick={toggleDarkmode} variant="light">
      {darkMode ? (
        <MaterialSunIcon className="w-6 h-6 text-foreground" />
      ) : (
        <MaterialMoonIcon className="w-6 h-6 text-foreground" />
      )}
    </Button>
  );
};

export default DarkmodeButton;
