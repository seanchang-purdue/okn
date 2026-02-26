// eslint.config.js
import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

// Limit TS configs to JS/TS files so they don't parse .astro files
const tsOnlyConfigs = tseslint.configs.recommended.map((cfg) => ({
  ...cfg,
  files: ["**/*.{js,jsx,ts,tsx}"],
}));

export default [
  // Base Astro configuration
  ...eslintPluginAstro.configs["flat/recommended"],

  // TypeScript configuration for regular TS/JS files
  ...tsOnlyConfigs,

  // Astro files parsing
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: eslintPluginAstro.parser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".astro"],
        tsconfigRootDir: import.meta.dirname,
        project: "./tsconfig.json",
      },
    },
    rules: {
      // Add Astro-specific rules here if needed
    },
  },
];
