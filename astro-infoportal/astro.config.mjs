// @ts-check
import {defineConfig} from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    routes: {
      extend: {
        exclude: [
          {pattern: '/@vite/*'},
          {pattern: '/@id/*'},
          {pattern: '/@react-refresh'},
        ],
      },
    },
  }),

  i18n: {
    locales: ['nb', 'nn', 'en'],
    defaultLocale: 'nb',
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [react({experimentalReactChildren: true})],
});
