import { isDarkmode } from "../stores/darkmodeStore";

function updateDarkMode() {
  if (isDarkmode.get()) {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
  } else {
    document.body.classList.add("light");
    document.body.classList.remove("dark");
  }
}

// Initial setup
updateDarkMode();

// Listen for changes
isDarkmode.subscribe(updateDarkMode);
