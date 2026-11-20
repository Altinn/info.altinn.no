# docker build -t infoportal-backup backup-infoportal

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS sqlpackage
ARG SQLPACKAGE_VERSION=170.5.96
RUN dotnet tool install microsoft.sqlpackage --version "${SQLPACKAGE_VERSION}" --tool-path /opt/sqlpackage

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS binaries
ARG RCLONE_VERSION=1.75.2
# From https://github.com/rclone/rclone/releases/download/v1.75.2/SHA256SUMS
ARG RCLONE_SHA256=349ac8fba6ff65d6247043f1750cdcb518ec5d500ef91463a10d37c0ccdf3702
RUN apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/*
WORKDIR /download
RUN curl -fsSLo rclone.zip "https://github.com/rclone/rclone/releases/download/v${RCLONE_VERSION}/rclone-v${RCLONE_VERSION}-linux-amd64.zip" \
	&& echo "${RCLONE_SHA256}  rclone.zip" | sha256sum -c - \
	&& unzip -j rclone.zip "*/rclone" -d /opt/bin

FROM mcr.microsoft.com/dotnet/runtime:10.0
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates curl jq \
	&& rm -rf /var/lib/apt/lists/*
COPY --from=sqlpackage /opt/sqlpackage /opt/sqlpackage
COPY --from=binaries /opt/bin/ /usr/local/bin/
COPY --chmod=755 backup.sh /usr/local/bin/backup.sh
# No rclone config file: remotes come from RCLONE_CONFIG_* variables.
ENV PATH="/opt/sqlpackage:${PATH}" \
	WORK_DIR=/tmp/backup \
	RCLONE_CONFIG=""
USER app
ENTRYPOINT ["/usr/local/bin/backup.sh"]
