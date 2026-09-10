import { dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  // Next owns these plugins; pnpm intentionally does not hoist them to our root.
  resolvePluginsRelativeTo: dirname(require.resolve("eslint-config-next")),
});

export default [...compat.extends("next/core-web-vitals")];
