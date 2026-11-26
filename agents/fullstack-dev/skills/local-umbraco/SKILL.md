---
name: local-umbraco
description: Run the info.altinn.no Umbraco CMS locally on SQLite, with the document types from uSync and a backoffice user, and point the Astro frontend at it. Use when a task needs Umbraco running, such as to try a backend change, the Delivery API or the backoffice.
---

# Run Umbraco locally

`appsettings.Development.json` points Umbraco at a SQL Server with no address, and an environment's database needs the
VPN, so run it on a SQLite database of its own instead. Environment variables override the settings without changing
a file in the checkout:

```sh
cd /home/agent/code/info.altinn.no/umbraco-infoportal
export ASPNETCORE_ENVIRONMENT=Development \
  ConnectionStrings__umbracoDbDSN='Data Source=|DataDirectory|/Umbraco.sqlite.db;Cache=Shared;Foreign Keys=True;Pooling=True' \
  ConnectionStrings__umbracoDbDSN_ProviderName=Microsoft.Data.Sqlite \
  Umbraco__CMS__Unattended__InstallUnattended=true \
  Umbraco__CMS__Unattended__UnattendedUserName=Agent \
  Umbraco__CMS__Unattended__UnattendedUserEmail=agent@example.com \
  Umbraco__CMS__Unattended__UnattendedUserPassword=LocalOnly-Agent-1234 \
  uSync__Settings__ImportOnFirstBoot=true \
  Umbraco__CMS__Global__UseHttps=false \
  Umbraco__CMS__Security__BackOfficeHost=http://localhost:43450
dotnet run --urls http://localhost:43450 > /tmp/umbraco.log 2>&1 &
```

- The first start installs the database in `umbraco/Data/` and imports the document types and settings from
  `uSync/v18/`, which takes about a minute. It is ready when `http://localhost:43450/umbraco` answers 200. Later starts
  reuse the database. Delete `umbraco/Data/Umbraco.sqlite.db*` to start over.
- The last two settings let the backoffice sign in over plain HTTP. Without them it answers `This server only accepts
  HTTPS requests` and sends the browser to `https://localhost:44391`, which serves nothing here.
- The database has the schema but no content. Create the content a task needs in the backoffice, at
  `http://localhost:43450/umbraco`, signed in as `agent@example.com`. Entra sign-in does not work locally.
- uSync reports a few import errors on first boot. They are known, so look for new ones only.
- Media, search and cache purging reach Azure, Elasticsearch and Cloudflare, which this agent has no access to, so
  expect errors from them in the log. Run Elasticsearch in a container as the README describes when search matters.
- Stop it with `kill %1` from the same shell, or by its PID from `ps`. `pkill -f` with a pattern that also matches
  your own command line kills that shell too.

To have the frontend use it, write `UMBRACO_API_URL=http://localhost:43450/` to `astro-infoportal/.dev.vars`, which
Git ignores, and restart `pnpm dev`. Remove the file when you are done, so the frontend reads AT22 again.
