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
pull requests.

To try a change to the image before CI publishes it, use the `build` variant, which builds it on your machine and
runs as `info-fullstack-dev-build`:

```sh
agentctl apply --variant build --wait --timeout 30m
```

## 6. Give it a copy of the prod database (optional)

For tasks that need real content, the agent runs Umbraco on a copy of prod. It cannot export one itself, so you do, on
your machine, on the VPN, as [`scripts/db/README.md`](../scripts/db/README.md) describes, and copy the file in:

```sh
cd ~/info.altinn.no
scripts/db/export-bacpac.sh prod --auth token
ssh agentctl-info-fullstack-dev mkdir -p code/info.altinn.no/.bacpacs
scp .bacpacs/prod-umbraco-<timestamp>.bacpac agentctl-info-fullstack-dev:code/info.altinn.no/.bacpacs/
```

Then ask it to use the copy. It imports the newest one with its `local-prod-db` skill. The `worktree` variant sees
your `.bacpacs/` already, so it needs no copying. Export again when you want it to have newer content.

## 7. Open it in your own browser (optional)

To look at the agent's frontend and Umbraco yourself, with the copy of prod from step 6, run this from your checkout
in WSL, and leave it running:

```sh
agents/fullstack-dev/scripts/forward.sh    # or name the agent: forward.sh info-fullstack-dev-build
```

It starts the database, Umbraco and the frontend in the agent with
[`stack.sh`](../agents/fullstack-dev/scripts/stack.sh), which takes a few minutes the first time, and forwards them to
your machine until Ctrl+C. Then open, also in Windows:

- the frontend at http://localhost:4321
- the backoffice at http://localhost:43450/umbraco, signed in as the prod user that
  [`scripts/db/README.md`](../scripts/db/README.md) names, with the username and password form. What you publish
  there shows on the frontend.

Stop your own frontend or Umbraco first, since the ports are the same as in the agent. The servers keep running in
the agent after Ctrl+C; stop them with
`agentctl exec <agent> -- bash -c '~/code/info.altinn.no/agents/fullstack-dev/scripts/stack.sh down'`.
The agent's checkout needs a branch that has `stack.sh`.

## 8. Look at its code in VS Code (optional)

VS Code's Remote-SSH extension opens the agent's checkout as it is, with its changes as it makes them, without copying
anything out. The agent's SSH host only works from WSL's `ssh`, though, so VS Code on Windows needs a wrapper. Install
the **Remote - SSH** extension in VS Code on Windows, and run this in WSL:

```sh
agents/fullstack-dev/scripts/vscode-ssh.sh
```

It writes `ssh-wsl.bat` to your Windows user folder and prints four settings. Add them to VS Code's user settings
(Ctrl+Shift+P → _Preferences: Open User Settings (JSON)_). Then run _Remote-SSH: Connect to Host…_, type
`agentctl-<agent name>`, such as `agentctl-info-fullstack-dev`, and open `/home/agent/code/info.altinn.no`.

Without `remotePlatform`, it waits for an answer to a question that is easy to miss, at the top of the window. Without
`enableDynamicForwarding: false`, it fails with `ECONNREFUSED`, since it connects before WSL has passed the port on to
Windows. Read rather than edit while the agent works, or you change the same files at once.

## 9. Check that it works

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
agentctl apply --variant build --wait --timeout 30m
git -C ~/info.altinn.no checkout agents/fullstack-dev/Dockerfile
```

CI uses Azure's mirror for amd64 the same way. The images keep Ubuntu's own sources.

**`Agent resource changed concurrently` after `delete`.** The agent stays at `Terminating` until a running build
ends. Stop it with `pkill -f "apt-get install"`.

**Podman instead of Docker.** Local builds work with a Podman engine that answers to `docker`.
