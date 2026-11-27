import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.jsonc" },
			// Fallback bindings for tests only. In deployed environments they come from wrangler.jsonc.
			miniflare: {
				kvNamespaces: ["FALLBACK_KV"],
			},
		}),
	],
});
