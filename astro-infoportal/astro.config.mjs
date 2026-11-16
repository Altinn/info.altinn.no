import {defineConfig} from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import {createRequire} from 'node:module';
import path from 'node:path';

// Workaround: Vite 7 does not serve /@vite/client in Astro 6 dev mode,
// which blocks React hydration. This plugin fixes it.
function viteClientFix() {
  let clientEntry;
  return {
    name: 'vite-client-fix',
    configResolved(config) {
      // Resolve vite from astro's location so we serve the client of the vite
      // instance that is actually running. The project's own `vite` devDependency
      // can be a different version, and vite only injects __HMR_*__ defines into
      // its own client.mjs.
      const require = createRequire(import.meta.url);
      const astroRequire = createRequire(require.resolve('astro/package.json'));
      clientEntry = path.resolve(
        path.dirname(astroRequire.resolve('vite/package.json')),
        'dist/client/client.mjs',
      );
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/@vite/client') {
          req.url = `/@fs/${clientEntry}`;
        }
        next();
      });
    },
  };
}

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
  vite: {
    plugins: [viteClientFix()],
    build: {
      minify: 'esbuild',
      cssMinify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          assetFileNames: '[name][extname]'
        },
      },
    },
    environments: {
      client: {
        build: {
          rollupOptions: {
            output: {
              entryFileNames: '[name].js',
              chunkFileNames: '[name].js'
            },
          },
        },
      },
    },    
  },
});
