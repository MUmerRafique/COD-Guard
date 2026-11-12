import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([".next/**", "node_modules/**", "coverage/**"]),
  {
    rules: {
      "no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
