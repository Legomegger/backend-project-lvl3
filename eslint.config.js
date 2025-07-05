import js from "@eslint/js";
import globals from "globals";
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from "eslint/config";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js, stylistic }, rules: {'@stylistic/indent': ['error', 2]}, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: { ...globals.node, ...globals.jest } } },
]);
