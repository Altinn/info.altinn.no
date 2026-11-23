# The images of the full-stack developer agent for info.altinn.no, built on the agentctl base images
# (https://github.com/digdir/digdir-agents/blob/main/images/agentctl-base/README.md). `minimal` has what the frontend,
# the Workers and the Umbraco backend need to build and test. `desktop` adds Chromium and a graphical desktop, for
# screenshots of pages, stories and the backoffice. .github/workflows/fullstack-dev-agent-images.yml publishes both.
FROM ghcr.io/digdir/agentctl-base:ubuntu-26.04-v0.1.0-preview.15@sha256:dd96a8413e1890b58ae4cde092bfc8b97fcb9e221822fdcb8bb3dc26466be949 AS minimal

# The base ends as the unprivileged agent user; installing packages needs root again.
USER root

# An Ubuntu mirror for this stage's packages, restored at its end. CI passes Azure's mirror for amd64, where
# archive.ubuntu.com and security.ubuntu.com are often slow from GitHub's runners. Empty by default, so local builds
# use Ubuntu's own sources. The script is mounted, not copied, so it is not in the image.
ARG APT_MIRROR=
RUN --mount=type=bind,source=common/apt-mirror.sh,target=/tmp/apt-mirror.sh sh /tmp/apt-mirror.sh use "${APT_MIRROR}"

# The .NET SDK the Umbraco projects target (net10.0), from Ubuntu, whose security updates keep it patched. The
# repository pins no SDK patch version, and its Dockerfile builds on mcr.microsoft.com/dotnet/sdk:10.0.
RUN apt-get update \
    && apt-get install --yes --no-install-recommends dotnet-sdk-10.0 \
    && rm -rf /var/lib/apt/lists/* \
    && dotnet --version

ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
ENV DOTNET_NOLOGO=1
# dotnet tools, such as microsoft.sqlpackage, install here.
ENV PATH=/home/agent/.dotnet/tools:${PATH}

# pnpm at the version and checksum `packageManager` in the repository's package.json pins. The base image's Node.js
# meets its `devEngines` (>24.18.0). npm's cache goes to /tmp, since HOME is /home/agent in this step too.
ARG PNPM_VERSION=12.14.0
ARG PNPM_SHA512=c18ba6d87993d3d164cb5e8948f32b2c06ee854487e06cd8d86781342fb3e5bb4634367034711e86802baa9c37bea906ce1929ad08d70884c97d801df13389a6
RUN if [ -r /run/agent/tls/ca-bundle.pem ]; then export NODE_EXTRA_CA_CERTS=/run/agent/tls/ca-bundle.pem; fi \
    && curl -fsSL "https://registry.npmjs.org/pnpm/-/pnpm-${PNPM_VERSION}.tgz" -o /tmp/pnpm.tgz \
    && echo "${PNPM_SHA512}  /tmp/pnpm.tgz" | sha512sum -c - \
    && npm install --global --cache /tmp/npm-cache --no-audit --no-fund /tmp/pnpm.tgz \
    && rm -rf /tmp/pnpm.tgz /tmp/npm-cache \
    && pnpm --version

# Podman, with the `docker` command and Docker Compose, for Elasticsearch, the Umbraco image and docker-compose.yml.
RUN agent-feature install containers

# agentctl and agentd, so the agent can try changes to its own definition in nested agents.
COPY --from=ghcr.io/digdir/agentctl:v0.1.0-preview.15@sha256:1bc767955b6740c4b65e402332e8099154a0da8a4a80ae8f778182647dcdf40e /agentctl /agentd /usr/local/bin/

# The repository to clone at boot.
# --chmod, so the image does not depend on the file's mode in the checkout: a file only its owner can read would leave
# the clone service unable to read the list.
COPY --chmod=0644 common/workspace.list /etc/agent-workspace.d/info-altinn-no.list

# Back to Ubuntu's own sources, so the image does not depend on the build's mirror.
RUN --mount=type=bind,source=common/apt-mirror.sh,target=/tmp/apt-mirror.sh sh /tmp/apt-mirror.sh restore

RUN agentctl --version && agent-image-check

USER agent

# The minimal image plus Chromium and a graphical desktop.
FROM minimal AS desktop

USER root

# The same mirror as in minimal (see there).
ARG APT_MIRROR=
RUN --mount=type=bind,source=common/apt-mirror.sh,target=/tmp/apt-mirror.sh sh /tmp/apt-mirror.sh use "${APT_MIRROR}"

RUN agent-feature install desktop

# Back to Ubuntu's own sources, so the image does not depend on the build's mirror.
RUN --mount=type=bind,source=common/apt-mirror.sh,target=/tmp/apt-mirror.sh sh /tmp/apt-mirror.sh restore

# What `agent-feature env desktop` prints.
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright
ENV DISPLAY=:1
ENV DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
ENV ACCESSIBILITY_ENABLED=1
ENV PLAYWRIGHT_MCP_EXECUTABLE_PATH=/usr/local/libexec/agent-playwright-chromium
ENV XDG_CURRENT_DESKTOP=X-Openbox:XFCE

RUN agent-image-check

USER agent
