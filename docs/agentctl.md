# Running Claude Code in a sandbox with agentctl

> **Status: draft, written while setting it up for the first time (issue #933).** Steps marked _(not done yet)_ have
> not been tried.

[agentctl](https://github.com/digdir/digdir-agents/blob/main/agentctl/README.md) runs coding agents such as Claude
Code in isolated virtual machines (sandboxes) on your own machine. This recipe sets it up for the first time on
Windows with WSL2, for work on info.altinn.no.

## Why

When Claude Code runs directly on your machine, it runs as you: it can read all your files and use your `gh` login,
your wrangler (Cloudflare) login and everything else you have. The only safety net is approving its actions one by
one.

With agentctl, each agent gets its own virtual machine:

- **Real secrets never enter the sandbox.** The agent sees placeholders. All its network traffic goes through your
  machine, which puts the real token into requests, and only to the hosts that token is allowed for.
- **It only gets the access you give it**, declared in the agent's manifest (`agent.yaml`): which GitHub token, which
  secrets, which network rules.
- **No permission prompts inside the sandbox**, so an agent can work on its own for a long time.
- **Sessions survive.** An agent is a computer that keeps its disk. You can disconnect and pick up the same
  conversation later, and run several agents at once.

## Terms

| Term | Meaning |
|---|---|
| `agentctl` | The command you type. Holds no state of its own. |
| `agentd` | The background service on your machine that owns the agents and keeps them matching their manifests. |
| Agent | A sandbox (virtual machine) declared in an `agent.yaml`, with one or more sessions. |
| Session | One running Claude Code (or Codex, Pi) in an agent. |
| Login | A GitHub token or Claude login stored on your machine under a name, such as `default`. Manifests refer to the name. |

## Prerequisites

- **WSL2 with `/dev/kvm`.** Check with `ls -l /dev/kvm`.
- **Your user must be in the `kvm` group.** See [step 1](#1-give-your-user-access-to-kvm).
- **A Claude Code subscription.**
- **Docker in WSL**, only when the image is built on your machine: a personal agent, or the `nested-build` variant to
  try a team agent before its images are published. A Podman engine that answers to `docker` commands works too.

## 1. Give your user access to KVM

The sandboxes are virtual machines, and they need `/dev/kvm`, which only members of the `kvm` group can use:

```sh
ls -l /dev/kvm            # crw-rw---- 1 root kvm ...
id | grep -o kvm          # no output means you are not in the group
sudo usermod -aG kvm $USER
```

Then restart WSL, so every process gets the new group. In PowerShell:

```powershell
wsl --shutdown
```

Check that `id | grep -o kvm` prints `kvm` in a new WSL terminal.

If you have already installed agentctl and `agentd` is running, it must also be restarted (see
[troubleshooting](#troubleshooting)).

## 2. Install agentctl

```sh
curl -fsSL https://raw.githubusercontent.com/digdir/digdir-agents/main/agentctl/install.sh | sh
agentctl --version
```

It installs `agentctl` and `agentd` in `~/.local/bin` without sudo, and checks the checksum of the download.

## 3. Log in to Claude

```sh
agentctl claude login
agentctl claude list      # should show the login "default"
```

You log in once on your machine. Agents only ever see a placeholder for the credential.

## 4. Give agents a GitHub token

Agents need a GitHub token to clone, push and open pull requests. Use a **fine-grained token limited to one
repository**:

```sh
agentctl github login default
```

- Choose **2** (create a fine-grained token). It opens GitHub's form.
- **Owner:** `Altinn`. A fine-grained token can only belong to one owner. For ki.norge.no (owner `digdir`), make a
  second login under another name, such as `agentctl github login digdir`.
- **Token name:** something that tells you what it is for in your GitHub settings, such as
  `agentctl info.altinn.no (<your machine name>)`.
- **Expiration:** 30 to 90 days.
- **Repository access:** only `info.altinn.no`.
- **Permissions:**

| Permission | Set to | Why |
|---|---|---|
| Contents | Read and write | Push branches |
| Pull requests | Read and write | Open pull requests |
| Issues | Read and write | Comment on issues |
| Commit statuses | Read-only | See CI results |
| Metadata | Read-only | Required |
| Actions | **Read-only** (default is read and write) | Write would let the agent start workflows by hand, including Terraform runs against prod |
| Workflows | **No access** (default is read and write) | Write would let the agent change workflows, which run with the repository's secrets |

agentctl then shows which GitHub user the token acts as. With a token on your own account, that is you, so the
agent's commits and pull requests show as yours. Answer `y` to keep it.

```sh
agentctl github list      # LOGIN default, KIND fine-grained, EXPIRES ...
```

When the token expires, create a new one and run `agentctl github login default` again.

The name `default` matters: the example manifests and the agent builder use `login: default` unless told otherwise.

## 4b. Optional: give agents a read-only Cloudflare token

For tasks that need Cloudflare's logs, such as finding requests that fail often (#752) or reducing logging (#901),
the agent can get a **read-only** Cloudflare API token. The manifest asks for it as the optional secret
`cloudflare-readonly`, so the agent starts without it.

1. In the Cloudflare dashboard, open your profile (top right) → **My Profile** → **API Tokens** → **Create Token**.
2. Choose **Custom**. The form asks for a token name, policies, expiration and client IP filtering. Each policy is one
   of _account_, _zone_ or _user_: add an **account policy** for the Account rows below and a **zone policy** for the
   Zone row. (Older versions of the dashboard instead have **Get started** under **Custom token**, with one list of
   permissions.)
3. **Token name:** for example `agentctl cloudflare-readonly (<your machine name>)`.
4. **Permissions** (one row each, with **+ Add more**):
   - _Account_ → **Account Analytics** → **Read**: traffic analytics through the GraphQL Analytics API. Confirmed in
     Cloudflare's docs.
   - _Account_ → **Workers Observability** → **Read**: Workers Logs. Cloudflare's API reference only lists
     _Workers Observability Write_ for the endpoint that queries Workers Logs, but we tested it: Read is enough.
   - _Zone_ → **Analytics** → **Read**: zone traffic analytics. Likely needed, not confirmed.
   - Nothing with **Edit**, and none of _Workers Scripts_, _Workers Routes_, _DNS_, _Zone Settings_ or _Cache Purge_.
5. **Account Resources:** _Include_ → the Altinn account only.
6. **Zone Resources:** _Include_ → _Specific zone_ → only the zones the task needs, such as `altinn.no`. If the zone
   list is not offered, there is no Zone permission in the token.
7. **Client IP Address Filtering:** leave empty. Requests leave from your machine's IP address, which changes.
8. **TTL:** a start date of today and an end date about 30 days ahead.
9. **Continue to summary** → check that every line says Read → **Create Token**.
10. Copy the token. Cloudflare only shows it once.
11. Store it on your machine, and paste the token when asked:

    ```sh
    agentctl secret set cloudflare-readonly --hosts api.cloudflare.com
    agentctl secret list
    ```

12. Test it on your machine, without saving the token in your shell history:

    ```sh
    read -rs CF_TOKEN; echo
    curl -s -H "Authorization: Bearer $CF_TOKEN" https://api.cloudflare.com/client/v4/user/tokens/verify
    ```

    `"status": "active"` means the token works. To test what it can and cannot do from inside the agent, see
    [Testing the agent](#testing-the-agent).

The sandbox sees a placeholder in `CLOUDFLARE_API_TOKEN`, and the real token is only put into requests to
`api.cloudflare.com`. wrangler in the agent reads `CLOUDFLARE_API_TOKEN`.

Things to know:

- **Log content is data, not instructions.** Paths, user agents and referers in the logs are written by whoever sends
  the request. A read-only token limits what a manipulated agent can do.
- **Logs can hold personal data**, such as IP addresses. What the agent reads goes to the model, as when you paste
  logs into Claude Code yourself.

## 5. Install the agentctl skill

```sh
agentctl skills install --bundled agentctl --user
```

This lets Claude Code on your machine (outside any sandbox) drive agents for you: hand them work, follow up and read
the results. Start new Claude Code sessions afterwards to pick it up.

## 6. Make the agent with the agent builder

The agent builder is itself an agent. It studies the repository, asks what the new agent is for, writes its
definition and tests it.

```sh
cd ~/info.altinn.no
agentctl new
```

What it asked, and what we answered:

| Question | Answer | Why |
|---|---|---|
| Mount `scripts/db/.env`? It may hold real keys. | Your choice; `n` is stricter | It only holds the password for the local SQL Server container. The builder does not need it. |
| Role | Full-stack developer | The repo has Astro (frontend), Cloudflare Workers and Umbraco/.NET (backend). |
| What should it run and show when a task is done? | Tests + screenshots | Runs Biome, Vitest and the .NET tests, and adds screenshots to pull requests for UI changes. |
| Owner: team or personal? | Team | Puts the definition in the repo under `agents/fullstack-dev/`, with a CI workflow that publishes the image, so everyone on the team can run the same agent after the PR is merged. Personal would keep it in `~/agents` on your machine, built locally. Owner only decides where the definition lives: the agent's pull requests go to the team repo either way. |
| Other repos? | No, just this one | The GitHub token only reaches `Altinn/info.altinn.no`. ki.norge.no (owner `digdir`) gets its own agent and login. |
| Which services and secrets? | GitHub only | The frontend reads from the public at22 Umbraco API and at22 Elasticsearch, and Umbraco runs locally on SQLite, so development needs no secrets. `ALTINN_SUBSCRIPTION_KEY` is optional in the code. Network: everything allowed except `metadata.google.internal`. The local-database scripts need VPN and Entra, which an agent cannot get. We added an optional read-only Cloudflare token afterwards (see [step 4b](#4b-optional-give-agents-a-read-only-cloudflare-token)). |

### While the builder works

- **The builder's session can move to the background.** Claude Code then shows a list with the headings _Needs
  input_, _Working_ and _Completed_. Do not type in the field "describe a task for a new session", which starts a new
  session. Press **Enter** to open the session under _Needs input_, where the builder is waiting for an answer.
- **The builder asks before running shell commands**, such as `find` and `grep` to read the repo's Node and .NET
  versions. Read-only commands like these are safe to approve (**Yes**). **Yes, and switch to auto mode** stops the
  questions. That is reasonable since the builder runs in a sandbox without real secrets, but it can then also change
  files in your checkout without asking. Answer one by one if you want to see what it writes.
- **The builder clones `digdir/digdir-agents`** (public) into `~/repositories` in its own sandbox, to read the
  example definitions and the agentctl release tags. Safe to approve: it only writes inside the sandbox.
- **It then checks out the tag matching your agentctl version** and reads the files of the `dotnet-dev` example,
  which it uses as a template. Also safe to approve. Many prompts follow in a row like this.
- **We switched to auto mode** for the builder (choose **Yes, and switch to auto mode** at a prompt). It runs in a
  sandbox without real secrets, and auto mode still stops actions it judges risky. What it writes to your checkout
  shows up in `git status` and `git diff`, and nothing is committed until you do it, so review the files before
  committing.

### The plan it proposed

The builder ends the questions by proposing a plan, which we accepted (**Yes, go ahead**):

- Images in two stages: _minimal_ (tools only) and _desktop_ (adds a desktop with a browser, for screenshots).
- Node 24, pnpm 12.14.0 (from `packageManager` in `package.json`), .NET 10 (`net10.0` in the `.csproj` files) and
  Podman.
- 4 CPU, 8 GiB memory, 64 GiB disk.
- GitHub only (login `default`).
- Images published from a CI workflow to `ghcr.io/altinn/info.altinn.no`.

It then writes `agents/fullstack-dev/` and the CI workflow, and tries the agent in a nested agent (an agent inside its
own sandbox).

Two things to check before the pull request is merged:

- **Who can pull the image.** Packages on ghcr.io are often private by default. Colleagues, and agentctl on their
  machines, must be able to pull it.
- **The workflow file must be pushed by a person.** The agents' GitHub token has no _Workflows_ permission (see
  [step 4](#4-give-agents-a-github-token)), so pushing a change under `.github/workflows/` from an agent fails.

Tell the builder as well:

- The GitHub login is `default`, for `Altinn/info.altinn.no`.
- No access to Azure, no deployment, and no Cloudflare token that can change anything.

Note: when the agent runs the site locally, Astro gets its content from Umbraco in at22 by default
(`UMBRACO_API_URL`). If at22 cannot be reached from the sandbox, screenshots will not work, but tests will.

## 7. Review what the builder wrote

After about 20 minutes the builder reported that it was done. It commits nothing. What it wrote:

| Path | What |
|---|---|
| `agents/fullstack-dev/Dockerfile` | Two stages on the agentctl base image, pinned by digest: `minimal` (.NET 10, pnpm, Podman, agentctl) and `desktop` (adds Chromium and a desktop). |
| `agents/fullstack-dev/{minimal,desktop}/agent.yaml` | The manifests. Each has variants: `nested` (smaller, to run inside another agent), `nested-build` (builds the image from your checkout instead of pulling it) and `worktree`. |
| `agents/fullstack-dev/common/workspace.list` | The repositories cloned at boot: only `Altinn/info.altinn.no`. |
| `agents/fullstack-dev/instructions.md`, `improving.md`, `worktree.md`, `*/environment.md` | What Claude Code in the agent is told about its computer and how to work. |
| `agents/fullstack-dev/skills/` | `pr-evidence` (what a pull request shows, how to take screenshots) and `local-umbraco` (running Umbraco on SQLite). |
| `.github/workflows/fullstack-dev-agent-images.yml` | Builds both images for amd64 and arm64. On `main` it publishes `ghcr.io/altinn/info.altinn.no/fullstack-dev-{minimal,desktop}:latest`. Pull requests only build. |

What to check in the manifest (`desktop/agent.yaml`):

- **GitHub:** `accounts: [{type: github, login: default}]`, the login from [step 4](#4-give-agents-a-github-token).
- **Secrets:** only `cloudflare-readonly`, optional (see [step 4b](#4b-optional-give-agents-a-read-only-cloudflare-token)).
- **Claude:** `login: any`, so whichever Claude login you stored. Codex is optional.
- **Network:** `mode: mediated`, `allow: all`, except `metadata.google.internal`.
- **Access:** SSH, and VNC (the desktop) in the desktop stage.

What to check in the workflow: the token only gets `contents: read` and `packages: write`, the actions are pinned to
commit SHAs, and pull requests build without publishing.

The builder tried both images in nested agents: tool versions, `pnpm test` and `pnpm build` in astro-infoportal,
Vitest in cache-infoportal and cms-infoportal, `dotnet test`, Umbraco on SQLite, containers, `pnpm dev` against at22
with a screenshot in Chromium, and a Claude Code session following the instructions. It could not try pushing to
GitHub (it had no token), the CI workflow or the arm64 build.

It also found problems in the repository, worth their own issues:

- Biome reports 265 errors on `main`, so the agent only checks the files it changes.
- `Other_token_errors_are_not_retried_and_log_exactly_one_error` fails the first time `dotnet test` runs on a fresh
  machine, because ASP.NET logs a warning when it creates its first data-protection key.
- Umbraco's README says it runs on SQLite by default, but `appsettings.Development.json` points to SQL Server.
- There is a `storybook` script, but no Storybook configuration or stories.

## 8. Try the agent before the pull request is merged _(not done yet)_

The manifests pull the image from ghcr.io, which only exists after the workflow has run on `main`. Until then, the
`nested-build` variant builds the image on your machine (needs Docker, or Podman):

```sh
cd ~/info.altinn.no/agents/fullstack-dev/desktop
agentctl apply --variant nested-build --wait --timeout 30m
```

To check on a build in progress:

```sh
agentctl get agents                                    # READY True when it is done
agentctl describe agent/info-fullstack-dev-nested      # "→ Resolve sandbox image (Nm)" while it builds
pstree -apl $(pgrep -f buildah-oci-runtime) | grep -v '{exe}' | head   # the build step running right now
```

A `Failure` or `exit status` line under _Conditions_ can be from an earlier attempt: `→ Resolve sandbox image` with a
growing time means agentd is building again.

The first build takes more than 10 minutes, which is the default timeout of `--wait`. If it times out, the build
continues in the background: check with `agentctl get agents` and `agentctl describe agent/info-fullstack-dev-nested`.
Podman (answering to `docker`) worked for the build.

What happened the first time: the agent became Ready, but `describe` showed `Workspace False CloneFailed`. In the
agent, `agentctl exec agent/info-fullstack-dev-nested -- sudo journalctl -u agent-workspace-init` said
`cannot open /etc/agent-workspace.d/info-altinn-no.list: Permission denied`. The builder had written
`common/workspace.list` readable only by its owner (`-rw-------`), and the Dockerfile copied it into the image with
that mode, owned by root. Fixed with `COPY --chmod=0644` in the Dockerfile. To rebuild after a change to the
Dockerfile, delete the agent and apply it again:

```sh
agentctl delete agent/info-fullstack-dev-nested
agentctl apply --variant nested-build --wait --timeout 30m
```

The second time, it timed out again after 30 minutes. `agentctl describe agent/info-fullstack-dev-nested` showed
`→ Resolve sandbox image (34m) Build Docker image`, and the build had hung: `apt-get` in the desktop stage
(`agent-feature install desktop`, installing `ffmpeg`) was waiting on a download that had stopped. Not a
Docker/Podman problem; the same build had worked before. See
[troubleshooting](#the-image-build-hangs-on-a-download).

### Speeding up the local build with a mirror

agentctl cannot pass build arguments, so to use a fast Ubuntu mirror for a local test build, change the default in
the Dockerfile **locally**, build, and undo the change straight away:

```sh
cd ~/info.altinn.no/agents/fullstack-dev/desktop
sed -i 's|^ARG APT_MIRROR=$|ARG APT_MIRROR=http://no.archive.ubuntu.com/ubuntu|' ../Dockerfile
agentctl apply --variant nested-build --wait --timeout 30m
git -C ~/info.altinn.no checkout agents/fullstack-dev/Dockerfile
```

The image is the same as without the mirror: each stage switches back to Ubuntu's own sources at the end. If an
earlier build of the agent is still running, `agentctl delete` leaves the agent at `Terminating` and `apply` fails
with `Agent resource changed concurrently` until that build ends; stop it with `pkill -f "apt-get install"`.

Running agentctl from Windows instead of WSL does not help: the slow part is Ubuntu's servers, and Windows reaches
them over the same connection.

### What we checked in the test agent

| Check | How | Result |
|---|---|---|
| The repo is cloned at boot | `agentctl describe` shows `Workspace True Cloned`; `agentctl exec agent/<name> -- ls ~/code` | ✅ `~/code/info.altinn.no` |
| GitHub login | `agentctl exec agent/<name> -- gh auth status` | ✅ logged in as the token's user, through `GITHUB_TOKEN` |
| Pushing | `git push --dry-run` in `~/code/info.altinn.no` | ✅ for what a dry run checks. It does not prove write access; the first real pull request does. |
| Cloudflare token | `agentctl secret list` | Not stored yet. `agentctl describe` prints `Secrets: stored cloudflare-readonly` even when it is not: that line says where the secret comes from, not that it exists. `agentctl secret list` is the one to trust. |

### Working in the test agent

```sh
agentctl attach session/test --agent info-fullstack-dev-nested    # Claude Code inside the sandbox
```

Leave with Claude Code's normal exit (or close the terminal); the session keeps running. The same command takes you
back to it. Other ways in:

- `agentctl tui`: every agent and session in one view.
- `agentctl ssh info-fullstack-dev-nested`: a plain shell in the sandbox.
- `agentctl vnc info-fullstack-dev-nested --web`: the desktop in your browser, to watch Chromium when the agent takes
  screenshots.

To see which Claude account a session uses, type `/status` in it. On your machine, `agentctl claude list` shows the
stored Claude logins and which agents use each.

The code is in `~/code/info.altinn.no` in the sandbox. It is the agent's own clone from GitHub, not your checkout:
your local changes are not there, and its changes reach you only through branches it pushes.

### Testing the agent

- **Claude login:** `/status` in a session shows the account. Do not run `/login` inside the sandbox: that puts the real
  credential in it. Log in on your machine with `agentctl claude login`; sessions get a placeholder.
- **GitHub:** we asked the agent to open a pull request with a Hello World change. It worked. Close such test pull
  requests and delete their branches afterwards.
- **Cloudflare**, before and after storing the token (step 4b). Ask the agent in a session:
  1. Without the token: _"Tell me whether `CLOUDFLARE_API_TOKEN` is set (only its length) and call
     `https://api.cloudflare.com/client/v4/user/tokens/verify` with it."_ Expected: length 0 and an error. ✅ The
     agent reported the variable as not set, and Cloudflare rejected the empty `Authorization: Bearer` header.
  2. Store the token with `agentctl secret set cloudflare-readonly --hosts api.cloudflare.com`, and ask again.
     Expected: `"status": "active"`. The first characters of the variable should not match your real token, since
     the sandbox only sees a placeholder. ✅ The agent saw a 34-character placeholder starting with `$AGENT`, and
     `verify` answered `"status": "active"`. Start a new session after storing the secret, to be sure it sees it.
  3. _"Use the Cloudflare API (Workers Observability) to find the 5 most frequent paths with a 4xx or 5xx status for
     the Worker cache-infoportal-prod over the last hour. Don't change anything in Cloudflare."_ Shows whether
     _Workers Observability: Read_ is enough for Workers Logs. ✅ It is: the agent listed the most frequent 404s
     (browser icons such as `/favicon.ico`, and old Altinn 2 paths such as `/ui/messagebox/`).
  4. _"Try to create a KV namespace named `agent-write-test` with wrangler. It should fail. If it succeeds, delete it
     right away and tell me."_ Expected: an authorization error, which confirms the token is read-only. ✅ wrangler
     got `Authentication error [code: 10000]`, and so did listing KV namespaces.
  5. Then a real task, such as issue #752.

## 9. Commit and open a pull request

Commit `agents/fullstack-dev/` and the workflow on a branch, push and open a pull request. Push it yourself: the
agents' token has no _Workflows_ permission. When the workflow has published on `main`, make the two ghcr.io packages
readable for the team.

Delete the builder when you are done with it:

```sh
agentctl delete agent/agent-builder-info-altinn-no
```

## 10. Start the agent

Once the images are published:

```sh
agentctl apply -f ~/info.altinn.no/agents/fullstack-dev/desktop/agent.yaml --wait   # or minimal/agent.yaml
```

## 11. Give the agent its first task _(not done yet)_

## Troubleshooting

### `sandbox process exited (signal: 6 (SIGABRT)) before agent relay became available`

Look in the sandbox's log:

```sh
tail -5 ~/.agent/microsandbox/runtime/sandboxes/*/logs/runtime.log
```

`Error creating the Kvm object: Error(13)` means permission denied on `/dev/kvm`. Either:

- **Your user is not in the `kvm` group.** See [step 1](#1-give-your-user-access-to-kvm).
- **You are in the group, but `agentd` started before you joined.** A running process keeps the groups it started
  with. Check:

  ```sh
  grep Groups /proc/$(pgrep -x agentd)/status    # the kvm group's number must be there
  getent group kvm                               # shows the kvm group's number
  ```

  Stop it, and run `agentctl` again from a terminal where `id` shows `kvm`. That starts a new `agentd`. Agents and
  their state are kept on disk.

  ```sh
  pkill -x agentd
  agentctl new
  ```

### The image build hangs on a download

`agentctl describe agent/<name>` shows `→ Resolve sandbox image (<many minutes>) Build Docker image`, and nothing
happens. See what the build is doing:

```sh
pstree -apl $(pgrep -f buildah-oci-runtime) | head
```

If it is `apt-get` (or `curl`) whose download has stopped, stop that process. The build step then fails, and agentd should
retry the build, reusing the steps that were done:

```sh
pkill -f "apt-get install"
agentctl describe agent/<name>    # Provisioning shows the build starting again
```

If it keeps hanging, check whether a VPN is on. VPNs in WSL often break large downloads from containers.

To check whether a VPN is involved (Tailscale, for example):

```sh
tailscale status                                  # which devices are in the tailnet, and any exit node
tailscale debug prefs | grep -i ExitNodeID        # empty: internet traffic does not go through Tailscale
ip route | grep default                           # "via ... dev eth0": internet traffic goes out through WSL's own network
/mnt/c/Windows/System32/ipconfig.exe | grep -i adapter   # VPN adapters on the Windows side
```

Tailscale without an exit node only carries traffic to the tailnet (100.x addresses), not downloads from the
internet, so it does not explain a hanging `apt-get`.

On 2026-11-23 the build was slow for another reason: Ubuntu's main package servers (`archive.ubuntu.com`,
`security.ubuntu.com`) were very slow or timed out from here, while the rest of the internet was fast. Compare:

```sh
curl -so /dev/null -m 15 -w "%{speed_download} B/s\n" http://archive.ubuntu.com/ubuntu/dists/resolute/main/binary-amd64/Packages.gz
curl -so /dev/null -m 15 -w "%{speed_download} B/s\n" http://no.archive.ubuntu.com/ubuntu/dists/resolute/main/binary-amd64/Packages.gz
curl -so /dev/null -m 15 -w "%{speed_download} B/s\n" "https://speed.cloudflare.com/__down?bytes=20000000"
```

If only the Ubuntu servers are slow, there is nothing to fix on your machine: let agentd keep retrying, or try later.

### The CI image build is slow on amd64

The same slow Ubuntu servers made the `Build (amd64)` job in `fullstack-dev-agent-images.yml` take more than
25 minutes, while `Build (arm64)` took 2 (arm64 uses `ports.ubuntu.com`, which is fast). The workflow therefore passes
`APT_MIRROR=http://azure.archive.ubuntu.com/ubuntu` for amd64. The Dockerfile points apt at that mirror at the start
of each stage and back to Ubuntu's own sources at the end (`common/apt-mirror.sh`), so the published images and
local builds are unchanged. Locally, with `--build-arg APT_MIRROR=http://no.archive.ubuntu.com/ubuntu`, the
`minimal` stage built in 44 seconds. In CI, `Build (amd64)` then took under 2 minutes, like arm64, downloading at
19–35 MB/s from Azure's mirror.
