# Umbraco Infoportal Backend

This is the Umbraco CMS backend for the Altinn infoportal, built with .NET.

## Prerequisites
- [.NET SDK](https://dotnet.microsoft.com/download)

## Development

To run the application locally from this folder:

```bash
cd umbraco-infoportal
dotnet add package SQLitePCLRaw.bundle_e_sqlite3
dotnet restore
dotnet build
dotnet run
```

Alternatively, if you are using an IDE like Visual Studio or VS Code, you can use the built-in run configuration (`launchSettings.json`).

Once running, navigate to the default port indicated in your console output to view the site, or append `/umbraco` to access the Umbraco CMS backoffice.

## Project structure

The code is organised by **functional area**: one folder per feature, holding everything that feature needs. To find the code for a feature, open its folder.

| Area                   | What it does                                                                 |
|------------------------|------------------------------------------------------------------------------|
| `Hosting/`             | Key Vault, Kestrel, reverse proxy headers and BackOfficeHost override         |
| `Telemetry/`           | OpenTelemetry tracing                                                        |
| `MediaStorage/`        | Media files and image cache in Azure Blob Storage                            |
| `Authentication/`      | Microsoft Entra ID login to the backoffice                                   |
| `Search/`              | Elasticsearch indexing on publish, full reindex, search queries              |
| `CachePurge/`          | Purges Cloudflare cache for affected URLs when content changes               |
| `PropertyConversions/` | Turns stored property values (rich text, block lists) into the JSON Astro gets |
| `ContentFilters/`      | Delivery API filters, e.g. `?filter=industry:...`                            |
| `Preview/`             | Preview URLs pointing at the Astro frontend                                  |
| `Redirects/`           | `/api/redirect`, used by Astro to resolve redirects and moved pages          |
| `ContactForm/`         | `/api/contactform`, sends contact forms by email, rate limited               |
| `MaintenanceBanner/`   | Maintenance message shown in the backoffice header                           |
| `ArticleExport/`       | Backoffice export of articles to Word                                        |
| `FormChanges/`         | Backoffice dashboard of changes in the form catalogue                        |
| `MetaImport/`          | Import of form metadata                                                      |

Inside an area, classes are sorted by **what kind of class** they are:

| Location                   | Holds                                                    | Recognised by                          |
|----------------------------|----------------------------------------------------------|----------------------------------------|
| `<Area>Composer.cs`        | All DI and notification registrations for the area       | `: IComposer`                          |
| `<Name>Options.cs`         | Strongly-typed config sections                           | Bound with `Configure<T>()`            |
| `Controllers/`             | HTTP endpoints (public API and Management API)           | `: ControllerBase` / `ManagementApiControllerBase` |
| `Services/`                | Business logic and clients for external systems          | Plain classes, injected through DI     |
| `Models/`                  | DTOs, request/response records                           | Data only, no logic                    |
| `NotificationHandlers/`    | Reactions to Umbraco events (publish, move, startup ...) | `: INotificationHandler<T>`            |
| `Jobs/`                    | Long-running background work                             | `: IHostedService` / `BackgroundService` |
| `PropertyValueConverters/` | Delivery API property converters                         | `: IPropertyValueConverter`            |
| `Filters/`                 | Delivery API query filters and index fields              | `: IFilterHandler, IContentIndexHandler` |
| `Resources/`               | Embedded files (word lists, ...)                         | `<EmbeddedResource>` in the csproj     |

Rules:

- **Registrations go in the area's composer.** Umbraco finds and runs every `IComposer` automatically.
  `Program.cs` only holds what must run before Umbraco starts.
- **The namespace matches the folder**, e.g. `Infoportal.Cms.Search.Services`.
- **One public type per file**, and the file is named after the type.
- **External integrations are ordinary services in the area that uses them.** There are no separate adapter projects.
- **Backoffice UI for an area lives in `App_Plugins/<Area>/`**, e.g. `App_Plugins/Search/`.
- **Tests mirror the folders:** `umbraco-infoportal.Tests/<Area>/...`.

To add a new area, create the folder, add an `<Area>Composer.cs` if it registers anything, and put classes in the subfolders above.

### Database migrations

There are currently no custom database migrations. Each environment's `umbracoKeyValue` table still has the row
`Umbraco.Core.Upgrader.State+Infoportal = normalize-legacy-block-udis-20260813`, left by a one-off repair for the
Umbraco 18 upgrade that has since been removed (see [PR 688](https://github.com/Altinn/info.altinn.no/pull/688)). If you add a migration plan, either give it a different
name than `Infoportal`, or start it with `From("normalize-legacy-block-udis-20260813")`. A plan named `Infoportal`
that starts from an empty state can't resolve that stored state, and startup migrations fail in every environment.

## Database
The project utilizes a local SQLite database by default, housed within the `umbraco/Data/` directory.

To work against real content instead, copy an environment's database to your machine and run
Umbraco against it — see [scripts/db/README.md](../scripts/db/README.md). That writes
`appsettings.Local.json`, which is loaded automatically in Development and takes precedence
over the SQLite default.

## Elasticsearch (Search)

Search is powered by Elasticsearch. For local development, run Elasticsearch in Docker:

```
docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:9.0.1
```

After starting Umbraco, trigger a full reindex to populate the search index. The endpoint is part of the Umbraco Management API and requires a backoffice admin user (bearer JWT):

```
POST http://localhost:43450/umbraco/management/api/v1/search/reindex
GET  http://localhost:43450/umbraco/management/api/v1/search/reindex/status
```

The reindex builds new versioned indices (`infoportal-<guid>-nb` etc.) while search keeps using the current ones, then atomically points the `infoportal-nb`/`-nn`/`-en` aliases at the new indices and deletes the old ones. Publishes made during the reindex are written to both.

Visible under the "Search" group in `/umbraco/swagger`. To call from Postman, copy the `Authorization: Bearer ...` header from a logged-in backoffice session (DevTools → Network → any management API request).