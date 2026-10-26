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