// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
    i18n: {
    locales: ["nb", "nn", "en"],
    defaultLocale: "nb",
        routing: {
        prefixDefaultLocale: false
    }
  }
});