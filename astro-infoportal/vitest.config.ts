import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@components": resolve(__dirname, "src/Components"),
      "@layouts": resolve(__dirname, "src/layouts"),
      "@pages": resolve(__dirname, "src/pages"),
      "@styles": resolve(__dirname, "src/styles"),
      "@utils": resolve(__dirname, "src/utils"),
      "@api": resolve(__dirname, "src/api"),
      "@constants": resolve(__dirname, "src/Constants"),
      "@services": resolve(__dirname, "src/Services"),
      "@models": resolve(__dirname, "src/Models"),
      "@transformers": resolve(__dirname, "src/transformers"),
      "@i18n": resolve(__dirname, "src/i18n"),
    },
  },
  test: {
    // Pure-TS unit tests (e.g. rich-text HTML transforms) run in Node.
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
