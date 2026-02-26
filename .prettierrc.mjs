// .prettierrc.mjs
/** @type {import("prettier").Config} */
export default {
  plugins: ["prettier-plugin-astro"],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
  semi: true,
  tabWidth: 2,
  printWidth: 80,
  singleQuote: false,
  trailingComma: "es5",
  bracketSpacing: true
};
