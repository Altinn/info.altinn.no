# Local copy of the Umbraco database

Copy an environment's database to your machine and run Umbraco against it.

```bash
scripts/db/refresh-local-db.sh at22 --auth token
```

Then start Umbraco. The connection string is written for you.

## 1. Get access

You need to be a member of the Entra group **`DIS AzSQL Admin Dev IP`**, which is the Entra
admin on the dev SQL servers. Ask the platform team. Prod is a separate grant.

You also need to be **connected to the VPN** — the databases are Private Link addresses and
do not resolve otherwise.

## 2. Install the tools

**All platforms**

```bash
dotnet tool install -g microsoft.sqlpackage     # ensure ~/.dotnet/tools is on PATH
az login                                        # used for database authentication
```

**macOS** — Microsoft ships no arm64 SQL Server image, and it only runs under Rosetta-backed
emulation, so use Colima rather than Docker Desktop or podman:

```bash
brew install colima docker docker-compose sqlcmd
colima start --vm-type=vz --vz-rosetta --cpu 4 --memory 8 --disk 60
```

**Linux**

```bash
sudo apt-get install -y docker.io sqlcmd        # or your distro's equivalent
```

**Windows** — work inside WSL2 (Ubuntu); the scripts are not run from PowerShell. Either
enable Docker Desktop's WSL2 integration, or install Docker inside the distro, then follow the
Linux steps. Keep the repo on the Linux filesystem, not `/mnt/c`, or everything will be slow.

## 3. Run it

```bash
scripts/db/refresh-local-db.sh at22 --auth token
```

Exports the database, starts SQL Server locally, imports, and writes the connection string to
`umbraco-infoportal/appsettings.Local.json`, which Umbraco loads automatically in Development.

**That file is git-ignored and contains a password. Never commit it.**

## 4. Start Umbraco

```bash
cd umbraco-infoportal
dotnet run
```

Then, to log in:

1. **Turn off the Entra auto-redirect.** In
   `umbraco-infoportal/App_Plugins/ExternalLoginProviders/umbraco-package.json`, set
   `"autoRedirect"` to `false`.

   Without this, `/umbraco` immediately redirects to Microsoft Entra ID, which is not
   configured locally, and you get
   `No authentication handler is registered for the scheme 'Umbraco.MicrosoftEntraId'`.

2. **Open https://localhost:44391/umbraco** and log in as `alv.gullbrand.lia@digdir.no` /
   `Test1234`. Use the local username and password form, not the Microsoft button.

   The backoffice requires HTTPS — plain `http://` returns
   `error:invalid_request ... This server only accepts HTTPS requests`. If the browser
   distrusts the certificate, run `dotnet dev-certs https --trust` once.

3. **Revert `umbraco-package.json` before committing.** It is a tracked file, so the change
   shows up in `git status` and must not be pushed.

Passwords come from the copied environment. If that account does not work in the environment
you copied, ask the team for a test account or reset one against your local container.

Use plain `dotnet run` so it starts in Development: that is what loads `appsettings.Local.json`
and keeps Key Vault disabled. Running with `--no-launch-profile` or a Production environment
fails with `Configuration value 'KeyVault:AkvUri' must be configured`.

The generated `appsettings.Local.json` also turns uSync's automatic export off
(`ExportOnSave: "None"`). Without it, working against a copied environment writes that
environment's entire schema and content to `umbraco-infoportal/uSync/` — thousands of
generated files sitting next to tracked ones. Exporting by hand from the backoffice still
works, which is how uSync files are meant to be produced.

Useful flags:

| Flag | Effect |
|---|---|
| `--skip-export` | reuse the newest `.bacpac` instead of downloading again |
| `--keep-container` | import into the running container instead of recreating it |
| `--auth password` | prompt for an Entra password instead of using an `az` token |

The four scripts also run standalone: `export-bacpac.sh`, `start-sqlserver.sh`,
`import-bacpac.sh`, `refresh-local-db.sh`. Pass `--help` to any of them.

## What you get, and what you don't

- **Images will be broken.** Media lives in Azure Blob Storage, not in the database.
- **Log in with the copied environment's backoffice users**, not local ones.
- For doctype and schema work, use uSync instead — it is lighter and involves no production
  data.

## Handling the data

A copy of a real environment contains real accounts and personal data.

- Keep it on an encrypted disk.
- Delete the `.bacpac` when you are done.
- Do not share it. `.bacpacs/` and `*.bacpac` are git-ignored; leave it that way.

Remote environments are strictly read-only: these scripts only ever run a connectivity check
and `sqlpackage /Action:Export` against them, and the import refuses any target that is not
localhost.

## If something fails

| Symptom | Cause and fix |
|---|---|
| `cannot resolve <host>` | Not on the VPN. |
| `Login failed for user '<token-identified principal>'` | You are not in the `DIS AzSQL Admin Dev IP` group. |
| `AADSTS50126` | Password auth is blocked for your account — use `--auth token`. |
| `SQL Server segfaulted on startup (exit 139)` | Your runtime emulates with qemu, not Rosetta. Use Colima as above, or set the fallback below. |
| `x509: negative serial number` | Only affects hand-run `sqlcmd`; prefix it with `GODEBUG=x509negativeserial=1`. |
| Import fails on a foreign key | The export caught the source mid-write. Re-export. |

**Without Rosetta** (arm64 machines that cannot use Colima) put this in `scripts/db/.env` to use
the arm64-native Azure SQL Edge instead. It works, but it is a reduced engine and not what the
environments run:

```
MSSQL_IMAGE=mcr.microsoft.com/azure-sql-edge
MSSQL_PLATFORM=linux/arm64
```

To point the scripts at a specific container runtime, set `CONTAINER_CLI` in `scripts/db/.env`.
