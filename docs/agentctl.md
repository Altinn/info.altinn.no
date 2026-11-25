# Developing with agentctl

[agentctl](https://github.com/digdir/digdir-agents/blob/main/agentctl/README.md) runs Claude Code in a small virtual
machine (a sandbox) on your own machine. The agent gets only the access you give it, real secrets never enter the
sandbox (it sees placeholders, and your machine puts the real values into requests to the allowed hosts), and it can
work without permission prompts. Sessions keep running when you disconnect.

This guide sets it up on Windows with WSL2. The agent itself is described in
[`agents/fullstack-dev/README.md`](../agents/fullstack-dev/README.md).

## 1. Prepare WSL

The sandbox needs `/dev/kvm`, which only members of the `kvm` group can use:

```sh
sudo usermod -aG kvm $USER
```

Then restart WSL from PowerShell with `wsl --shutdown`, and check in a new WSL terminal that `id` lists `kvm`.

## 2. Install agentctl and log in to Claude

```sh
curl -fsSL https://raw.githubusercontent.com/digdir/digdir-agents/main/agentctl/install.sh | sh
```

It installs to `~/.local/bin`, which Ubuntu only puts on `PATH` in shells started after that folder exists. Open a new
WSL terminal, and check that `agentctl --version` answers. If it still says `command not found`, your shell does not
add the folder, so add it yourself:

```sh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc   # ~/.zshrc for zsh
exec bash -l
```

Then log in:

```sh
agentctl claude login
agentctl skills install --bundled agentctl --user   # lets Claude Code on your machine drive agents
```

Always log in on your machine like this, never with `/login` inside a session: that would put the real credential in
the sandbox.

## 3. GitHub token

```sh
agentctl github login default
```

Choose **create a fine-grained token**, and fill in GitHub's form:

| Field | Value |
|---|---|
| Resource owner | `Altinn` |
| Repository access | Only `info.altinn.no` |
| Expiration | 30–90 days |
| Contents, Pull requests, Issues | Read and write |
| Commit statuses, Metadata | Read-only |
| Actions | **Read-only** (the default, read and write, lets it start workflows, including Terraform against prod) |
| Workflows | **No access** (write lets it change workflows, which run with the repository's secrets) |

The agent's commits and pull requests show as the token's user, which is you. Renew the token by running the command
again.

## 4. Cloudflare token (optional)

Only needed for tasks that read Cloudflare's logs or analytics. In the Cloudflare dashboard: **My Profile → API Tokens
→ Create Token → Custom**.

- **Account policy**, the Altinn account: _Account Analytics_ → Read, _Workers Observability_ → Read.
- **Zone policy**, only `altinn.no`: _Analytics_ → Read.
- Nothing with Edit. No IP filtering. Expiry about 30 days.

Then store it:

```sh
agentctl secret set cloudflare-readonly --hosts api.cloudflare.com
agentctl secret list
```

The agent sees it as `CLOUDFLARE_API_TOKEN`. Logs can hold personal data such as IP addresses, and what the agent
reads goes to the model.

## 5. Start the agent

```sh
cd ~/info.altinn.no/agents/fullstack-dev/desktop     # or minimal, without a browser
agentctl apply --wait --timeout 30m
agentctl attach session/main --agent info-fullstack-dev
```

The first start pulls the image, which takes a while. Other ways in: `agentctl tui` (all agents and sessions),
`agentctl ssh info-fullstack-dev` (a shell), `agentctl vnc info-fullstack-dev --web` (the desktop in a browser).

The code is the agent's own clone in `~/code/info.altinn.no`, not your checkout. Its changes reach you as branches and
pull requests. To get a file the agent wrote, such as notes it keeps outside the repository, copy it to WSL and open it
there (`code` opens it in VS Code):

```sh
agentctl ssh-config install    # once: lets ssh and scp reach agents as agentctl-<agent name>
scp agentctl-info-fullstack-dev:notes/analysis.md ~/notes/
code ~/notes/analysis.md
```

To try a change to the image before CI publishes it, use the `nested-build` variant, which builds it on your machine:

```sh
agentctl apply --variant nested-build --wait --timeout 30m
```

## 6. Check that it works

| What | How | Expected |
|---|---|---|
| Repo cloned | `agentctl describe agent/<name>` | `Workspace True Cloned` |
| Claude account | `/status` in a session | Your account |
| GitHub | Ask the agent to open a test pull request | It opens; close it afterwards |
| Cloudflare secret | Ask: _"Is `CLOUDFLARE_API_TOKEN` set? Give its length and first 6 characters, and call `https://api.cloudflare.com/client/v4/user/tokens/verify`."_ | A placeholder starting with `$AGENT`, and `"status": "active"` |
| Cloudflare read | Ask for the most frequent 4xx paths of `cache-infoportal-prod` over the last hour | A list |
| Cloudflare write | Ask it to create a KV namespace with wrangler | `Authentication error` |

A secret stored after a session started may need a new session.

## Troubleshooting

**`sandbox process exited (signal: 6 (SIGABRT))`.** See the sandbox log with
`tail -5 ~/.agent/microsandbox/runtime/sandboxes/*/logs/runtime.log`. `Error creating the Kvm object: Error(13)` means
no access to `/dev/kvm`: either you are not in the `kvm` group (step 1), or `agentd` started before you joined it.
In a terminal where `id` lists `kvm`, run `pkill -x agentd` and then any `agentctl` command, which starts it again.

**`apply --wait` times out.** The build carries on in the background. Check it:

```sh
agentctl get agents                       # READY True when done
agentctl describe agent/<name>            # "→ Resolve sandbox image (Nm)" while building
pstree -apl $(pgrep -f buildah-oci-runtime) | grep -v '{exe}' | head   # the step running now
```

An `exit status` under _Conditions_ can be from an earlier attempt.

**A local build hangs or crawls.** Ubuntu's own servers (`archive.ubuntu.com`, `security.ubuntu.com`) are sometimes
very slow. If `apt-get` makes no progress, `pkill -f "apt-get install"` makes agentd retry the step. To build from a
fast mirror, change the default locally, build, and undo it:

```sh
sed -i 's|^ARG APT_MIRROR=$|ARG APT_MIRROR=http://no.archive.ubuntu.com/ubuntu|' ../Dockerfile
agentctl apply --variant nested-build --wait --timeout 30m
git -C ~/info.altinn.no checkout agents/fullstack-dev/Dockerfile
```

CI uses Azure's mirror for amd64 the same way. The images keep Ubuntu's own sources.

**`Agent resource changed concurrently` after `delete`.** The agent stays at `Terminating` until a running build
ends. Stop it with `pkill -f "apt-get install"`.

**Podman instead of Docker.** Local builds work with a Podman engine that answers to `docker`.
