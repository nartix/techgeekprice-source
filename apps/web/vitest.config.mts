import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "next/navigation": "next/navigation.js",
    },
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: [
      "**/__tests__/**/*.{test,spec}.?(c|m)[jt]s?(x)",
      "src/**/*.{test,spec}.?(c|m)[jt]s?(x)",
      "tests/**/*.{test,spec}.?(c|m)[jt]s?(x)",
    ],
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
    setupFiles: ["./vitest.setup.ts"],
  },
});
