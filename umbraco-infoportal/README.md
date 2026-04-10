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

## Database
The project utilizes a local SQLite database by default, housed within the `umbraco/Data/` directory.

## Elasticsearch (Search)

Search is powered by Elasticsearch. For local development, run Elasticsearch in Docker:

```
docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:9.0.1
```

After starting Umbraco, trigger a full reindex to populate the search index:

```
POST http://localhost:43450/api/search/reindex
```