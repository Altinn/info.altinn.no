# Nightly backup of the Umbraco database and media to Cloudflare R2.
# Build from the repository root:  docker build -f backup-infoportal/Dockerfile -t infoportal-backup backup-infoportal

# --- sqlpackage (framework-dependent .NET tool) -------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS sqlpackage
ARG SQLPACKAGE_VERSION=170.5.96
RUN dotnet tool install microsoft.sqlpackage --version "${SQLPACKAGE_VERSION}" --tool-path /opt/sqlpackage

# --- rclone and age (static binaries, pinned and checksum-verified) ------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS binaries
ARG RCLONE_VERSION=1.75.2
# From https://github.com/rclone/rclone/releases/download/v1.75.2/SHA256SUMS
ARG RCLONE_SHA256=349ac8fba6ff65d6247043f1750cdcb518ec5d500ef91463a10d37c0ccdf3702
ARG AGE_VERSION=1.3.2
# sha256 of age-v1.3.2-linux-amd64.tar.gz (age publishes .proof files, not a SHA256SUMS list)
ARG AGE_SHA256=cbe24006683f8eb669266162894b9a522a1af52f2665fbc63a4bb032ed26ac10
RUN apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/*
WORKDIR /download
RUN curl -fsSLo rclone.zip "https://github.com/rclone/rclone/releases/download/v${RCLONE_VERSION}/rclone-v${RCLONE_VERSION}-linux-amd64.zip" \
	&& echo "${RCLONE_SHA256}  rclone.zip" | sha256sum -c - \
	&& unzip -j rclone.zip "*/rclone" -d /opt/bin
RUN curl -fsSLo age.tar.gz "https://github.com/FiloSottile/age/releases/download/v${AGE_VERSION}/age-v${AGE_VERSION}-linux-amd64.tar.gz" \
	&& echo "${AGE_SHA256}  age.tar.gz" | sha256sum -c - \
	&& tar -xzf age.tar.gz --strip-components=1 -C /opt/bin age/age age/age-keygen

# --- runtime ---------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/runtime:10.0
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates curl jq \
	&& rm -rf /var/lib/apt/lists/*
COPY --from=sqlpackage /opt/sqlpackage /opt/sqlpackage
COPY --from=binaries /opt/bin/ /usr/local/bin/
COPY --chmod=755 backup.sh /usr/local/bin/backup.sh
# RCLONE_CONFIG empty: all rclone remotes come from RCLONE_CONFIG_* variables, no config file.
ENV PATH="/opt/sqlpackage:${PATH}" \
	WORK_DIR=/tmp/backup \
	RCLONE_CONFIG=""
# Non-root user that ships with the .NET images.
USER app
ENTRYPOINT ["/usr/local/bin/backup.sh"]
