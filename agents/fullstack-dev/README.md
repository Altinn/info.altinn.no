# Full-stack developer agent

An [agentctl](https://github.com/digdir/digdir-agents) agent that develops info.altinn.no as a teammate would: the
Astro frontend, the Cloudflare Workers and the Umbraco CMS. It clones `Altinn/info.altinn.no` at boot, builds and tests
what it changes, and shows the result in its pull requests.

| Agent | Image |
| --- | --- |
| `minimal` | `ghcr.io/altinn/info.altinn.no/fullstack-dev-minimal`: the .NET 10 SDK, Node.js, pnpm, Podman |
| `desktop` | `ghcr.io/altinn/info.altinn.no/fullstack-dev-desktop`: `minimal` plus Chromium and a graphical desktop, for screenshots |

Both are named `info-fullstack-dev`. Pass `--name` to run both at once. Each has these variants:

| Variant | What it changes |
| --- | --- |
| `nested` | Sized to fit inside another agent, as `info-fullstack-dev-nested` |
| `build` | The image built from this checkout, to try a change to it before CI publishes it, as `info-fullstack-dev-build` |
| `nested-build` | `nested`, with the image built from this checkout, to try a change to it before CI publishes it |
| `worktree` | Mounts this checkout in place of a fresh clone, as `info-fullstack-dev-worktree` |

A variant of your own, such as `agent.mine.yaml`, which Git ignores, can extend any manifest beside it.

## Getting started

With [agentctl installed](https://github.com/digdir/digdir-agents/blob/main/agentctl/README.md#install):

```sh
agentctl claude login
agentctl github login default    # the account it pushes and opens pull requests as
cd agents/fullstack-dev/desktop  # or minimal, without a browser
agentctl apply --wait
agentctl tui
```

`agentctl github login default` signs in as a GitHub user made for the agent, or takes a fine-grained token with
`Contents` and `Pull requests` read and write on `Altinn/info.altinn.no`. Without it the agent still starts, but cannot
push. An optional read-only Cloudflare token, `cloudflare-readonly`, lets it read Workers logs and analytics.
`agentctl vnc --web` shows the `desktop` agent's desktop in your browser. [`docs/agentctl.md`](../../docs/agentctl.md)
walks through the setup on Windows with WSL, both tokens and troubleshooting.

## What it can and cannot do

It runs Biome, Vitest, the Astro build, the Workers' tests, `dotnet build` and `dotnet test`, runs the site
and Umbraco locally, also on a copy of the prod database that you export and give it, and takes screenshots on
`desktop`. It cannot export a database itself, which needs the VPN, nor plan or apply the Terraform, deploy, or reach
any environment's secrets. Its instructions tell it to say so.

## The definition

[`instructions.md`](instructions.md), its stage's `environment.md` and [`improving.md`](improving.md) are its
instructions, with [`worktree.md`](worktree.md) on the `worktree` variant.
[`skills/pr-evidence`](skills/pr-evidence/SKILL.md) says what its pull requests show, and
[`skills/local-umbraco`](skills/local-umbraco/SKILL.md) how it runs Umbraco on SQLite, since the README's default no
longer works, and [`skills/local-prod-db`](skills/local-prod-db/SKILL.md) how it runs it on a copy of prod, with
[`scripts/stack.sh`](scripts/stack.sh). [`scripts/forward.sh`](scripts/forward.sh) opens that in your own browser. The images are built from the
[`Dockerfile`](Dockerfile) on the agentctl base images and published by
[`fullstack-dev-agent-images.yml`](../../.github/workflows/fullstack-dev-agent-images.yml) when it changes on `main`.
