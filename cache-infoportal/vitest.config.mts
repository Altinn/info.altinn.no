import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.jsonc" },
			// Fallback bindings for tests only. In deployed environments they come from wrangler.jsonc (at22).
			miniflare: {
				r2Buckets: ["SNAPSHOTS", "MEDIA"],
				kvNamespaces: ["FALLBACK_KV"],
				bindings: { FALLBACK_PREVIEW_TOKEN: "test-token" },
			},
		}),
	],
});
