// eslint.config.js
import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default [
  // Base Astro configuration
  ...eslintPluginAstro.configs["flat/recommended"],

  // TypeScript configuration for regular TS files
  ...tseslint.configs.recommended,

  // TypeScript configuration for Astro files
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
      // Your custom rules for Astro files
      // "astro/no-set-html-directive": "error"
    },
  },
];
