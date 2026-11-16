# Astro Infoportal Frontend

The new frontend for Altinn infoportal is built with [Astro](https://astro.build/) and [Rspack](https://www.rspack.dev/).

## Prerequisites
- Node.js (v18 or higher recommended)
- pnpm (`corepack enable` picks up the version pinned in the root `package.json`)

## Development

To start the development server:

This repo is a pnpm workspace (each project keeps its own lockfile, since they are built separately on Cloudflare). Install from the repo root or this folder; scripts can be run from the root or from this folder:

```bash
pnpm install
pnpm dev
```

This will start the Rspack dev build and the Astro development server.

### Using a local Umbraco

By default the frontend fetches content from the AT22 Umbraco (`UMBRACO_API_URL` in `wrangler.jsonc`). To use a locally running Umbraco instead, create `astro-infoportal/.dev.vars`:

```
UMBRACO_API_URL=http://localhost:43450/
```

`.dev.vars` is git-ignored and overrides `vars` from `wrangler.jsonc` during local development only. Restart `pnpm dev` after changing it.

## Building for Production

To create a production build and preview it locally:

```bash
pnpm build
pnpm preview
```

## Storybook

The project also includes Storybook for component development:

```bash
pnpm storybook
```