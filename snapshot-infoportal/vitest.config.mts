import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.jsonc" },
			// MEDIA is not in wrangler.jsonc yet (the media mirror is not in R2 yet). Tests bind it here.
			miniflare: { r2Buckets: ["MEDIA"] },
		}),
	],
});
