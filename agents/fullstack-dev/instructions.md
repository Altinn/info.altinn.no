# Full-stack developer for info.altinn.no

You develop the Altinn infoportal in `/home/agent/code/info.altinn.no`, which this agent clones at boot: the Astro
frontend in `astro-infoportal`, the Cloudflare Workers in `cache-infoportal` and `cms-infoportal`, and the Umbraco CMS
in `umbraco-infoportal` with its tests in `umbraco-infoportal.Tests`. Read the root `README.md` and the README of each
part you change before you change it. They say how to install, run and build it.

Start each task on its own branch from the current `origin/main`. When several sessions work at once, give each its
own Git worktree under `/home/agent/code/.worktrees/<task>` instead, and leave the checkout itself clean.

## Before you call a task done

The repository has no CI that runs its tests, so run them yourself, for each part your change touches:

- `astro-infoportal`: `pnpm install`, `pnpm exec biome check <changed files>`, `pnpm test` and `pnpm build`.
- `cache-infoportal` and `cms-infoportal`: `pnpm install` and `pnpm exec vitest run`.
- `umbraco-infoportal`: `dotnet build` and `dotnet test` in `umbraco-infoportal.Tests`.

Each project has its own lockfile, so run `pnpm install` in the project's own folder. When a change can be seen, in a
page, a story or the backoffice, show it in the pull request as the `pr-evidence` skill describes. Say in the pull
request what you ran and what it gave.

Two things in the repository as it is:

- Biome already reports hundreds of errors on `main`, so check the files you change, and fix only what you introduce.
- On a machine where ASP.NET has no data protection key yet, the first `dotnet test` run fails
  `Other_token_errors_are_not_retried_and_log_exactly_one_error`, which then sees the warning ASP.NET logs when it
  creates that key. Run it again before you look into it.

To run Umbraco itself, use the `local-umbraco` skill. Its README's SQLite default no longer holds.

## Code comments

Comment only what the code cannot say: a reason that is not obvious, a constraint or a workaround, in a line or two.
Don't describe what the code does, and don't refer to issues or pull requests in code or tests; that belongs in the
commit message and the pull request. Make an exception only in rare cases, such as a workaround that should go once an
issue is fixed.

## What this agent cannot do

Say so, rather than work around it, when a task needs one of these:

- **A copy of an environment's database** (`scripts/db`): it needs the VPN and an Entra group this agent has neither of.
- **Azure, Cloudflare and Elastic Cloud credentials**: this agent cannot plan or apply the Terraform in
  `infrastructure/`, deploy a Worker, or reach Key Vault or the media storage accounts. `terraform` is not installed.
- **Secrets of any environment.** Never put one in a file, a commit or a pull request.
