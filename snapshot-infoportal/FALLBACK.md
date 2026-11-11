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
  snapshot that `snapshot:current` points to. Responses from the snapshot are not put in the edge cache.
  It has no public route, so it can only be reached through `cache-infoportal`.
- Every fallback response has the header `x-infoportal-snapshot: <snapshot id>` and `cache-control: no-store`
  (static files: 5 minutes), so browsers do not keep fallback pages after the site is back.
- `/health`, `/api/` and `/ui/` always go to origin, so health checks show the real state.
- Turning fallback on or off takes up to about a minute to reach all visitors (KV and in-memory caching).

What does not work in fallback mode:

- Contact forms. They post to `/api/contactform/send`, which goes to origin also in fallback mode (all of `/api/`
  does). If Umbraco is down, the form shows its usual error message. Other posts outside `/api/` get 503.
- Search results and other dynamic data (`/sok/?q=...`, `/inforportalapi/...`). The empty search page is shown.
- Media (`/media/...`) until the media bucket is bound (`MEDIA`, see below). Until then images and PDFs give 404.
- Old URLs that only exist in Umbraco's redirect tables and were not seen by the snapshot job.

## Test without affecting others (preview)

Requests with the header `x-infoportal-fallback: <token>` are served from the snapshot, for that request only.
They skip the edge cache, so what you see really comes from the snapshot.

Set the token once per environment on `cache-infoportal` (any long random string, for example from
`openssl rand -hex 32`; keep it in the team's password manager):

```bash
cd cache-infoportal && pnpm wrangler secret put FALLBACK_PREVIEW_TOKEN --env at22
```

Then:

```bash
curl -sI -H "x-infoportal-fallback: <token>" https://info.at22.altinn.cloud/hjelp/
```

Look for `x-infoportal-snapshot` in the response. In a browser, use an extension that adds request headers
(for example ModHeader).

## Turn on / off

```bash
# on
pnpm wrangler kv key put fallback:mode on --namespace-id 0edfe96c8cad4d7f8b4408d7f4120667 --remote

# off
pnpm wrangler kv key put fallback:mode off --namespace-id 0edfe96c8cad4d7f8b4408d7f4120667 --remote

# current state, and which snapshot is served
pnpm wrangler kv key get fallback:mode --namespace-id 0edfe96c8cad4d7f8b4408d7f4120667 --remote
pnpm wrangler kv key get snapshot:current --namespace-id 0edfe96c8cad4d7f8b4408d7f4120667 --remote
```

The namespace id is for at22 (`infoportal-fallback-at22`).

After turning on: check a few pages for `x-infoportal-snapshot`. After turning off: check that the header is gone.
Consider also turning off the nightly snapshot run while fallback is on, so a run against a broken origin cannot
fail validation in confusing ways (it would not replace the current snapshot anyway).

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
| cache-infoportal | `FALLBACK_PREVIEW_TOKEN` | Secret for the preview header (set by hand) | at22 |
| snapshot-infoportal | `SNAPSHOTS`, `FALLBACK_KV` | The snapshot bucket and the same KV namespace | at22 |
| snapshot-infoportal | `MEDIA` | R2 bucket with the Umbraco media mirror (`media/...`), written by backup-infoportal | not yet |

Without `SNAPSHOT_INFOPORTAL` and `FALLBACK_KV`, `cache-infoportal` never turns on fallback mode and behaves as before.
