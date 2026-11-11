# snapshot-infoportal

Cloudflare Worker that takes a full snapshot of info.altinn.no and stores it in R2.
`cache-infoportal` serves this snapshot if Azure/Umbraco is unavailable, so the site stays up.
Background and design: GitHub issue #905 and `docs/reservelosning/`.

**Status:** proof of concept, set up for `at22` only. Fallback is switched on manually (option B).

## How it works

```
cron 02:00 UTC / manual trigger
        │
        ▼
SnapshotWorkflow (Cloudflare Workflows, one step per batch, retried on failure)
  1. read /sitemap.xml from astro-infoportal (service binding, bypasses the edge cache)
  2. fetch every page   → R2 snapshots/{id}/p/{path}
  3. fetch CSS/JS/images referenced by the pages → same prefix
  4. write manifest.json + redirects.json
  5. validate (≥ MIN_SUCCESS_RATIO of sitemap URLs stored), otherwise stop
  6. KV snapshot:current = {id}      ← only now does cache-infoportal see the new snapshot
  7. delete old snapshots (keeps KEEP_SNAPSHOTS, never the current one)
```

If Umbraco is down while the job runs, validation fails and the previous snapshot stays current.

The storage format shared with `cache-infoportal` is described in [`src/keys.ts`](./src/keys.ts).

## Not done yet

- Umbraco media (`/media/...`) is not captured. It will get a shared `media/` mirror.
- Fallback reading is in `cache-infoportal` (see [`cache-infoportal/FALLBACK.md`](../cache-infoportal/FALLBACK.md)). Only at22 so far.
- Environments `at23`, `tt02` and `prod`.

## One-time setup per environment (example: at22)

```bash
pnpm wrangler r2 bucket create infoportal-snapshots-at22 --jurisdiction eu
pnpm wrangler kv namespace create infoportal-fallback-at22
```

Then put the KV namespace id and the public hostname (`SITE_ORIGIN`) into `wrangler.jsonc`.
The same bucket and KV namespace must also be bound in `cache-infoportal-at22`.

## Develop and test

```bash
pnpm install
pnpm test          # vitest with the Workers runtime; R2 and KV are simulated locally
pnpm typecheck
pnpm cf-typegen    # after changing bindings in wrangler.jsonc
```

## Deploy and run

```bash
pnpm wrangler deploy --env at22
pnpm wrangler workflows trigger snapshot-infoportal-at22 '{"trigger":"manual"}'
pnpm wrangler workflows instances list snapshot-infoportal-at22
pnpm wrangler workflows instances describe snapshot-infoportal-at22 latest
```

### Test runs

A test run takes only some pages. It is stored like a normal snapshot (id `test-...`), but it never
becomes `snapshot:current` and never deletes other snapshots. Remove test snapshots by hand in the dashboard.

```bash
pnpm wrangler workflows trigger snapshot-infoportal-at22 '{"trigger":"manual","limit":10}'
pnpm wrangler workflows trigger snapshot-infoportal-at22 '{"trigger":"manual","paths":["/","/hjelp/"]}'
```

`limit` takes the first N URLs from the sitemap. `paths` takes exactly those paths. At most 500 pages.

`limit` also adds the extra paths and the 404 pages (see below). `paths` takes only the given paths
(plus the 404 pages).

### What is captured

- All URLs in `/sitemap.xml`.
- `EXTRA_PATHS` in `src/extra-paths.ts`: pages Astro renders itself (search, contact forms, robots.txt, sitemaps).
  A 404 for one of these (for example `/llms.txt` without content in Umbraco) is listed under `unavailable`, not `failed`.
- The 404 page per language, stored as `404/{locale}.html` (from `NOT_FOUND_PROBES`).
- Linked pages: internal links (`<a href>`) on the captured pages that are not in the lists above are fetched too,
  up to 3 levels away from a listed page and at most `LINKED_PAGES_LIMIT` pages in total (500 in test runs). This
  catches pages the sitemap leaves out, such as nb-only pages linked under `/en/` or `/nn/` and the pages below
  `/om-altinn/`. Links that redirect go into `redirects.json` (same-site targets as paths), and their targets are
  fetched as well. The result is under
  `linked` in the manifest. Broken links show up in `linked.failed`.
- Static files referenced by the pages (CSS, JS, images, fonts).

Validation (`MIN_SUCCESS_RATIO`) only counts the sitemap and extra paths. Linked pages are a bonus and do not count.

### Watching Umbraco during a run

`scripts/probe-umbraco.sh` calls the Delivery API directly every 5 seconds and prints the response time, with a
summary (median, p95, max) on Ctrl+C. Start it a few minutes before a run for a baseline. If response times grow a
lot, lower `CONCURRENCY` or stop the run: `pnpm wrangler workflows instances terminate snapshot-infoportal-at22 <id>`.

### Unlisted links

Links that are still missing after the linked round (found on linked pages, or over the limit) are listed in
`unlisted.json` next to the manifest. The manifest has the count and the first 50. These pages will be missing in
fallback mode. It does not stop promotion.

In a test run the links are compared against the whole sitemap, so the rest of the site is not reported.

To read what is current:

```bash
pnpm wrangler kv key get snapshot:current --namespace-id <id> --remote
```

## Configuration (`vars`)

| Name | Meaning |
| --- | --- |
| `SITE_ORIGIN` | Public origin of the site in this environment. Used for request URLs, so the HTML gets the right absolute links. |
| `BATCH_SIZE` | URLs per workflow step. |
| `CONCURRENCY` | Parallel requests to Astro within a step. |
| `KEEP_SNAPSHOTS` | Number of snapshots kept in R2. |
| `MIN_SUCCESS_RATIO` | Share of sitemap URLs that must be stored before the snapshot is promoted. |
