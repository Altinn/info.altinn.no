---
name: local-prod-db
description: Run the info.altinn.no Umbraco CMS locally on a copy of the prod database, which the person who created you exported on their machine, and point the Astro frontend at it. Use when a task needs real content, such as to reproduce a bug on a page, check how a change renders existing pages, or test the Delivery API against what prod serves.
---

# Run Umbraco on a copy of prod

You cannot export a database yourself: that needs the VPN and an Entra group you have neither of. The person who
created you exports it on their machine, and you import the file into SQL Server in a container here. The data is
static, public content, so it is fine to work with, but the `.bacpac` and the database stay out of commits.

## 1. Find the copy

```sh
ls -t /home/agent/code/info.altinn.no/.bacpacs/*-umbraco-*.bacpac
```

Each name starts with its environment: `prod`, `at22`, `at23` or `tt02`. Use prod unless the person or the task names
another. The newest copy of the environment is used. Its name holds when it was exported, so say how old it is when that matters for the task.
When there is none, or it is too old, ask them to run this on their machine, where `info-fullstack-dev` is your name:

```sh
scripts/db/export-bacpac.sh prod --auth token
ssh agentctl-info-fullstack-dev mkdir -p code/info.altinn.no/.bacpacs
scp .bacpacs/prod-umbraco-<timestamp>.bacpac agentctl-info-fullstack-dev:code/info.altinn.no/.bacpacs/
```

On the `worktree` variant the folder is their checkout's, so a new export shows up here without copying.

## 2. Import it

```sh
cd /home/agent/code/info.altinn.no
scripts/db/refresh-local-db.sh prod --skip-export --env-out ~/.config/infoportal-db/umbraco.env
```

It starts SQL Server in a container (`infoportal-mssql`), replaces the database `umbraco` in it with the copy, and
writes the connection string to `~/.config/infoportal-db/umbraco.env`. It never touches `appsettings.Local.json`. The
first run pulls the SQL Server image, about 1.5 GB, and the import takes a few minutes.

The container and its database stay across sessions. After you restart, start it again with
`podman start infoportal-mssql`. Import again only for a newer copy, or to undo what a task changed in the database.

## 3. Run Umbraco and the frontend

```sh
/home/agent/code/info.altinn.no/agents/fullstack-dev/scripts/stack.sh up
```

It starts the database, imports the newest copy of prod when there is no database yet, starts Umbraco on
`http://localhost:43450` and the frontend on `http://127.0.0.1:4321` against it, and returns when both answer. Running
it again restarts only what is down. `stack.sh status` shows what runs, and which environment's copy the database holds.
For another environment, or a newer copy, run `stack.sh up --env at22 --import`, which replaces the database and what
was changed in it. `up --env` without `--import` refuses when the database holds another environment. `stack.sh down`
stops Umbraco and the frontend. The logs are `/tmp/umbraco.log` and `/tmp/astro.log`. Start them with it rather than by
hand: it sets what the backoffice sign-in needs over plain HTTP, and binds the frontend where the person's `forward.sh`
reaches it.

- When the branch has a newer Umbraco than prod, the first start upgrades the database. That is expected, and only
  happens here. Import again to get back to prod's version.
- The Delivery API and the frontend need no sign-in. The backoffice has prod's users, whose passwords you do not
  have, and Entra sign-in does not work locally. When a task needs the backoffice, ask the person, or use the
  `local-umbraco` skill's SQLite database, where you have a user of your own.
- Images are in prod's Azure storage, which you cannot reach, so they are missing.
- Search and cache purging reach Elasticsearch and Cloudflare, so expect errors from them in the log.

The frontend reads the local Umbraco through `astro-infoportal/.dev.vars`, which Git ignores. `stack.sh up` writes it
when there is none and `down` removes it again, so the frontend reads AT22 afterwards. When one is already there and
points elsewhere, `up` stops and says so. On the `worktree` variant that file is the person's: ask before you change
it, and put it back as it was when you are done.

SQL Server needs about 2 GB of memory on top of Umbraco and the frontend. The `nested` variants, with 3 GiB on
`minimal` and 4 GiB on `desktop`, are too small for it.

SQL Server exists only for amd64. On an arm64 machine, such as a Mac, it runs under emulation in this sandbox, which
it does not survive: `start-sqlserver.sh` stops with exit code 139. Check with `uname -m` first, and when it says
`aarch64`, tell the person that this skill needs an amd64 machine, rather than working around it.

## 4. Clean up

```sh
podman stop infoportal-mssql
```

stops the database and keeps it. `scripts/db/start-sqlserver.sh` recreates it empty. Delete old `.bacpac` files you
no longer need, so the disk does not fill up, except on the `worktree` variant, where `.bacpacs/` is the person's.
