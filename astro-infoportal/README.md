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

## Deploying

Each environment has its own Worker, configured under `env` in `wrangler.jsonc` (`name` and `vars`). Deploy with one command from the repo root (or `pnpm run deploy:<env>` from this folder):

```bash
pnpm run frontend:deploy:at22
pnpm run frontend:deploy:at23
pnpm run frontend:deploy:tt02
pnpm run frontend:deploy:prod
```

Do not edit `name` or `vars` at the top of `wrangler.jsonc` to pick an environment. The top level is only used for local development.

What the scripts do:

1. Stop if the working tree has uncommitted changes.
2. For `tt02` and `prod` only: switch to `main` and stop if it is not in sync with `origin/main`. `at22` and `at23` can be deployed from any branch, for example a `test/*` merge branch.
3. Build with `CLOUDFLARE_ENV=<env>`, then run `wrangler deploy --env <env>`.

The environment is chosen when building, not when deploying. The Astro Cloudflare adapter writes the selected environment's config to `dist/server/wrangler.json`, and `wrangler deploy` uses that file. It ignores the `--env` flag, so a `tt02` build deploys to `astro-infoportal-tt02` even with `--env prod`. Always use the scripts, which use the same environment for both steps. A plain `pnpm build` followed by `wrangler deploy` deploys to at22.

If you are not logged in to Cloudflare, Wrangler asks you to log in (`pnpm wrangler login`).

### Cache after a deploy

The deploy does not purge any cache. `cache-infoportal` keeps pages in Cloudflare's edge cache for up to 24 hours (`s-maxage`), so pages that are already cached keep showing the previous version until they expire or Umbraco purges them on publish. Pages that are not cached show the new version right away. Do not use purge everything: every page would then be rebuilt against Umbraco at the same time.

To check that the new version is running, request a page with a cache buster and look for something you know is new:

```bash
curl -s "https://info.altinn.no/?cb=$RANDOM" | grep -o "something-you-know-is-new"
```

## Storybook

The project also includes Storybook for component development:

```bash
pnpm storybook
```