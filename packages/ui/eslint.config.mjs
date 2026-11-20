import { config } from "@tgp/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [{ ignores: ["storybook-static/**"] }, ...config];
