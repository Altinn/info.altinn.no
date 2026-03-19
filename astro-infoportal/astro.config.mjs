import {defineConfig} from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    routes: {
      extend: {
        exclude: [
          {pattern: '/@*'},
          {pattern: '/@vite/*'},
          {pattern: '/@id/*'},
          {pattern: '/@fs/*'},
          {pattern: '/@react-refresh'},
          {pattern: '/node_modules/*'},
          {pattern: '/src/*'},
          {pattern: '/favicon.ico'},
          {pattern: '/_astro/*'},
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
