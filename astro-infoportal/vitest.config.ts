import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure-TS unit tests (e.g. rich-text HTML transforms) run in Node.
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
