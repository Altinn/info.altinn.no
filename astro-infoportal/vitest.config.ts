import { defineConfig } from "vitest/config";
import { resolve } from "path";

const src = resolve(__dirname, "src");

export default defineConfig({
  resolve: {
    alias: [
      { find: "@components", replacement: resolve(src, "Components") },
      { find: "@layouts", replacement: resolve(src, "layouts") },
      { find: "@pages", replacement: resolve(src, "pages") },
      { find: "@styles", replacement: resolve(src, "styles") },
      { find: "@utils", replacement: resolve(src, "utils") },
      { find: "@api", replacement: resolve(src, "api") },
      { find: "@constants", replacement: resolve(src, "Constants") },
      { find: "@services", replacement: resolve(src, "Services") },
      { find: "@models", replacement: resolve(src, "Models") },
      { find: "@transformers", replacement: resolve(src, "transformers") },
      { find: "@i18n", replacement: resolve(src, "i18n") },
      // Workers-only virtual module; see src/test-utils/cloudflareWorkers.ts.
      {
        find: "cloudflare:workers",
        replacement: resolve(src, "test-utils/cloudflareWorkers.ts"),
      },
      // tsconfig maps the root alias `/*` onto src/*, and a few modules import
      // that way (e.g. BannerBlock, which SiteLayout renders). Listed one by
      // one rather than as a `^/` pattern: that would also rewrite genuinely
      // absolute paths, starting with the test files' own.
      { find: "/App.Components", replacement: resolve(src, "App.Components") },
      { find: "/Components/", replacement: `${resolve(src, "Components")}/` },
      { find: "/Models/", replacement: `${resolve(src, "Models")}/` },
      { find: "/Services/", replacement: `${resolve(src, "Services")}/` },
    ],
  },
  test: {
    // Pure-TS unit tests (e.g. rich-text HTML transforms) run in Node.
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    server: {
      deps: {
        // altinn-components' modules import their own .css side-effects, which
        // Node cannot load as ESM. Inlining routes the package through Vite's
        // transform pipeline so component tests can render it (issue #713).
        inline: ["@altinn/altinn-components"],
      },
    },
  },
});
