# Fallback mode (runbook)

When Azure/Umbraco is down, `cache-infoportal` can serve info.altinn.no from the latest snapshot in R2 instead of
from Astro/Umbraco (issue #905, option B). The snapshot is made by `snapshot-infoportal`.

Only set up in **at22** for now.

## How it works

- `fallback:mode` = `on` in KV turns on fallback mode for all visitors.
- With fallback mode on, pages, static files, redirects and the 404 page come from the snapshot that
  `snapshot:current` points to. Astro/Umbraco and the edge cache are not used.
- Every fallback response has the header `x-infoportal-snapshot: <snapshot id>` and `cache-control: no-store`
  (static files: 5 minutes), so browsers do not keep fallback pages after the site is back.
- `/health`, `/api/` and `/ui/` always go to origin, so health checks show the real state.
- Turning fallback on or off takes up to about a minute to reach all visitors (KV and in-memory caching).

What does not work in fallback mode:

- Submitting forms (contact forms): answered with 503 and a short message.
- Search results and other dynamic data (`/sok/?q=...`, `/inforportalapi/...`). The empty search page is shown.
- Media (`/media/...`) until the media bucket is bound (`MEDIA`, see below). Until then images and PDFs give 404.
- Old URLs that only exist in Umbraco's redirect tables and were not seen by the snapshot job.

## Test without affecting others (preview)

Requests with the header `x-infoportal-fallback: <token>` are served from the snapshot, for that request only.

Set the token once per environment (any long random string, keep it in the team's password manager):

```bash
pnpm wrangler secret put FALLBACK_PREVIEW_TOKEN --env at22
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

## Bindings

| Binding | What | Environments |
|---|---|---|
| `SNAPSHOTS` | R2 bucket `infoportal-snapshots-{env}` (same as snapshot-infoportal) | at22 |
| `FALLBACK_KV` | KV namespace `infoportal-fallback-{env}` (same as snapshot-infoportal) | at22 |
| `MEDIA` | R2 bucket with the Umbraco media mirror (`media/...`), written by backup-infoportal | not yet |
| `FALLBACK_PREVIEW_TOKEN` | Secret for the preview header | at22 (set by hand) |

Without `SNAPSHOTS` and `FALLBACK_KV`, fallback mode is never active and the worker behaves as before.
