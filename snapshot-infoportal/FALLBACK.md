# Fallback mode (runbook)

When Azure/Umbraco is down, info.altinn.no can be served from the latest snapshot in R2 instead of from
Astro/Umbraco (issue #905, option B).

Only set up in **at22** for now.

## How it works

```
                                              ┌─ fallback off → astro-infoportal (as before)
browser → cache-infoportal → edge cache ─ miss ┤
                                              └─ fallback on  → snapshot-infoportal (serves from R2)
```

- The edge cache is used as usual, also in fallback mode: a page that is in the cache is served from there.
- Only when the cache cannot answer (a miss, or a cached 4xx) does `cache-infoportal` check `fallback:mode`
  (`src/fallback-switch.ts`). If it is `on`, the request goes to `snapshot-infoportal` through the
  `SNAPSHOT_INFOPORTAL` service binding instead of to Astro. Posts outside `/api/` go there too.
- A cached 4xx is not trusted in fallback mode, because Astro answers 404 when it cannot reach Umbraco, and
  that 404 is cached like any other page.
- `snapshot-infoportal` (`src/fallback.ts`) serves pages, static files, redirects and the 404 page from the
  snapshot that `snapshot:current` points to. It has no public route, so it can only be reached through
  `cache-infoportal`.
- Responses from the snapshot are put in the edge cache like responses from Astro (`s-maxage=86400`), so repeat
  requests are served from the cache. Browsers keep them only briefly (`max-age=60`, static files 5 minutes).
  503 answers (no snapshot, form posts) are never cached.
- **When fallback mode is turned off, the edge cache must be purged** (see below). Otherwise pages from the
  snapshot stay in the cache for up to 24 hours.
- Every fallback response has the header `x-infoportal-snapshot: <snapshot id>`. It stays on cached copies too,
  so it shows whether a page still comes from the snapshot.
- `/health`, `/api/` and `/ui/` always go to origin, so health checks show the real state.
- Turning fallback on or off takes up to about a minute to reach all visitors (KV and in-memory caching).

What does not work in fallback mode:

- Contact forms. They post to `/api/contactform/send`, which goes to origin also in fallback mode (all of `/api/`
  does). If Umbraco is down, the form shows its usual error message. Other posts outside `/api/` get 503.
- Search results and other dynamic data (`/sok/?q=...`, `/inforportalapi/...`). The empty search page is shown.
- Media (`/media/...`) that no captured page, CSS or JavaScript links to. Images and documents that pages link to are
  in the snapshot, in original size (the `?width=...` resizing is ignored). Files over 50 MB are skipped.
- Old URLs that only exist in Umbraco's redirect tables and were not seen by the snapshot job.

## Turn on / off

```bash
# on
pnpm wrangler kv key put fallback:mode on --namespace-id 0edfe96c8cad4d7f8b4408d7f4120667 --remote

# off (then purge the edge cache, see below)
pnpm wrangler kv key put fallback:mode off --namespace-id 0edfe96c8cad4d7f8b4408d7f4120667 --remote

# current state, and which snapshot is served
pnpm wrangler kv key get fallback:mode --namespace-id 0edfe96c8cad4d7f8b4408d7f4120667 --remote
pnpm wrangler kv key get snapshot:current --namespace-id 0edfe96c8cad4d7f8b4408d7f4120667 --remote
```

The namespace id is for at22 (`infoportal-fallback-at22`).

### Purge the edge cache after turning off

Wait about a minute after setting `off` (so no new snapshot responses are cached), then purge the site's cache in
the Cloudflare dashboard: the zone that contains the hostname → **Caching** → **Configuration** → **Purge Cache**.

- Prefer **Custom Purge** by hostname or prefix (`info.at22.altinn.cloud/`), so only this site is purged.
- **Purge Everything** purges the whole zone. Only use it if the zone contains nothing but this site.

Afterwards, pages without a query string should no longer have `x-infoportal-snapshot`:

```bash
curl -s -o /dev/null -D - "https://info.at22.altinn.cloud/hjelp/" | grep -i x-infoportal-snapshot   # expect no output
```

The first requests after the purge go to Astro/Umbraco again, so expect some extra load on Umbraco for a while.

Consider also turning off the nightly snapshot run while fallback is on, so a run against a broken origin cannot
fail validation in confusing ways (it would not replace the current snapshot anyway).

## Check that fallback mode works

Pages that were in the edge cache before fallback mode was turned on are still served from there, and have no
`x-infoportal-snapshot` header. That is expected. To see what the snapshot serves, add a random query string that
has not been used before: the edge cache treats it as a new page (a miss), while the snapshot ignores the query
string. The second request for the same URL comes from the edge cache, still with the header.

```bash
curl -s -o /dev/null -D - "https://info.at22.altinn.cloud/hjelp/?t=$RANDOM" | grep -i x-infoportal-snapshot
```

Use GET as above, not `curl -I`: HEAD requests never use the edge cache in `cache-infoportal` (all non-GET
requests skip it), so they would always go to the snapshot or to Astro and give a misleading result.

To test purging without purging the whole site, purge a single URL (Custom Purge → URL) with the exact query
string you used, for example `https://info.at22.altinn.cloud/hjelp/?t=12345`.

In a browser, open pages with `?t=<something>` added and look for `x-infoportal-snapshot` in the developer tools
(Network tab, response headers).

Testing in at22 means turning fallback mode on for everyone in at22 for a while, so tell the team first.
After turning off and purging: the same URL (same query string) should no longer show the header.

## Deploy

Deploy `snapshot-infoportal` first (it has the fetch handler), then `cache-infoportal` (it binds to it):

```bash
cd snapshot-infoportal && pnpm wrangler deploy --env at22
cd ../cache-infoportal && pnpm wrangler deploy --env at22
```

## Bindings

| Worker | Binding | What | Environments |
|---|---|---|---|
| cache-infoportal | `SNAPSHOT_INFOPORTAL` | Service binding to `snapshot-infoportal-{env}` | at22 |
| cache-infoportal | `FALLBACK_KV` | KV namespace `infoportal-fallback-{env}`, for `fallback:mode` | at22 |
| snapshot-infoportal | `SNAPSHOTS`, `FALLBACK_KV` | The snapshot bucket and the same KV namespace | at22 |
| snapshot-infoportal | `MEDIA` | Optional extra source for media the snapshot lacks (`media/...`), for example a later Umbraco media mirror | not yet |

Without `SNAPSHOT_INFOPORTAL` and `FALLBACK_KV`, `cache-infoportal` never turns on fallback mode and behaves as before.
