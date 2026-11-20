# backup-infoportal

Nightly backup of the Umbraco database and media to Cloudflare R2, so Umbraco can be restored even if
the data in Azure is lost. Runs as a Kubernetes CronJob next to Umbraco in AKS, at 02:00 UTC.

**Status:** tested from a local machine against at22 and the R2 bucket `infoportal-backup-at22`. The CronJob
is set up for at22 only (`syncroot/base/backup/`, included from `syncroot/at22/`).

## What it does

```
CronJob (AKS, product-infoportal, workload identity)
  ├─ sqlpackage export ── Azure SQL (Private Link) ──► r2:infoportal-backup-{env}/db/umbraco-{env}-{time}.bacpac
  │                                                    r2:infoportal-backup-{env}/db/latest.json
  └─ rclone sync ── Azure Blob (media) ──► r2:infoportal-backup-{env}/media/
                                           (deleted/changed files ──► r2:infoportal-backup-{env}/media-deleted/{time}/)
```

- **Database:** the `.bacpac` is uploaded **unencrypted**. The database holds almost only public content, plus
  editors' names and e-mail addresses, and we accept that trade-off for now. That makes access to the bucket
  the only protection, so:
  - the bucket must stay private: no public `r2.dev` URL and no custom domain,
  - the R2 token must only give access to this bucket,
  - everyone with access to the Cloudflare account can read the backups.

  `latest.json` records the object name, size and sha256 of the newest backup. Adding encryption later
  needs a code change.
- **Retention:** handled by R2 lifecycle rules on the bucket (for example delete `db/` and `media-deleted/`
  after 30 days), not by the script.
- **Media:** the originals are mirrored to the backup bucket. (The snapshot only holds the image sizes pages use,
  which is not enough to restore Umbraco.) Files deleted or overwritten in Umbraco are moved to `media-deleted/`
  instead of being lost. `--max-delete` (default 200) stops the run instead of emptying the mirror if the source
  ever looks empty.
- **Failures:** the database and media parts run independently. If either fails, the script exits non-zero and the Job fails.

## Files

| File | Purpose |
| --- | --- |
| `Dockerfile` | .NET 10 runtime + sqlpackage, rclone, jq, curl (pinned versions, checksums verified) |
| `backup.sh` | The job. All configuration is documented at the top of the file. |
| `run-local.sh` | Runs the image on your machine against a real environment, writing to a local folder or R2 (`--to-r2`). |
| `restore.sh` | Downloads a database backup from R2, checks it against `latest.json`, and optionally imports it locally. |

## Test locally

Needs the same access as `scripts/db` (VPN, `az login`, Entra group for SQL), and a role on the media
storage account that allows a user delegation SAS (the same as `scripts/blobs`).

```bash
backup-infoportal/run-local.sh at22               # database + media
backup-infoportal/run-local.sh at22 --skip-media  # database only
```

Output goes to `~/infoportal-backup-test/at22/` (outside the repo: it contains real data, so delete it when
done). Import the `.bacpac` from `db/` with `scripts/db/import-bacpac.sh` as usual.

### Against R2

Put an R2 API token for the bucket (Object Read & Write, this bucket only) in
`~/infoportal-backup-test/<env>/r2.env`, mode 600:

```
RCLONE_CONFIG_R2_ACCESS_KEY_ID=...
RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=...
RCLONE_CONFIG_R2_ENDPOINT=https://<account-id>.eu.r2.cloudflarestorage.com
```

```bash
backup-infoportal/run-local.sh at22 --to-r2      # back up to r2:infoportal-backup-at22 (add --tailscale in WSL)
backup-infoportal/restore.sh at22                # download latest and verify the checksum
backup-infoportal/restore.sh at22 --import       # ... and import into the local SQL Server
backup-infoportal/restore.sh at22 --list         # list database backups
```

The SQL server must be reached on its private address. Two things can go wrong, typically with Tailscale in WSL:

| Symptom | Cause | Fix |
| --- | --- | --- |
| "Deny Public Network Access is set to Yes" | WSL's DNS returns the public address, not Tailscale's | `--dns 100.100.100.100` |
| "an error occurred during the login process", retried for minutes | WSL's `eth0` has MTU 1280, so full-size Tailscale packets are lost. The login carries the Entra token and is the first large packet. | `--mtu 1200` |

`--tailscale` does both.

## Running in the cluster

| File | Purpose |
| --- | --- |
| `.github/workflows/backup-image-publish.yaml` | Builds this folder's image and publishes it as `ghcr.io/altinn/infoportal-backup:<tag>`. |
| `syncroot/base/backup/cronjob.yaml` | The CronJob. Runs as the `umbraco` service account (workload identity), which already has access to the database and the media container. |
| `syncroot/base/backup/r2-secrets.yaml` | ExternalSecret that reads the R2 token and endpoint from the Umbraco DIS Key Vault. |
| `syncroot/<env>/kustomization.yaml` | Opts the environment in (`../base/backup`), sets the image tag and the environment's bucket and media account. |

The CronJob gets these variables (see the header of `backup.sh` for all of them):

| Variable | at22 | Set in |
| --- | --- | --- |
| `ENV_NAME` | `at22` | overlay |
| `SQL_SERVER` | `${UMBRACO_SQL_CONN_FQDN}` | base. Flux substitution, as for Umbraco. |
| `MEDIA_ACCOUNT` | `infoportalmediaat224w17` | overlay |
| `DB_TARGET` | `r2:infoportal-backup-at22/db` | overlay |
| `MEDIA_TARGET` | `r2:infoportal-backup-at22/media` | overlay |
| `MEDIA_DELETED_TARGET` | `r2:infoportal-backup-at22/media-deleted` | overlay |
| `RCLONE_CONFIG_R2_TYPE`, `_PROVIDER` | `s3`, `Cloudflare` | base |
| `RCLONE_CONFIG_R2_NO_CHECK_BUCKET` | `true` | base. The token cannot create buckets. |
| `RCLONE_CONFIG_R2_STORAGE_CLASS` | `STANDARD` | base. Without it, rclone passes the Azure tier (`Hot`) on as storage class and R2 rejects every upload. |
| `RCLONE_CONFIG_R2_ACCESS_KEY_ID`, `_SECRET_ACCESS_KEY`, `_ENDPOINT` | | Key Vault → ExternalSecret `r2-backup` |

The pod runs **without the Linkerd sidecar** (`linkerd.io/inject: disabled`). Otherwise the sidecar keeps
running after the script exits and the Job never completes. It also runs with a read-only root filesystem;
`run-local.sh` runs the container the same way.

### Setting up an environment

1. **R2:** create the bucket `infoportal-backup-<env>` (EU jurisdiction), a lifecycle rule that deletes `db/`
   and `media-deleted/` after 30 days, and an API token with Object Read & Write on that bucket only.
   Do not enable the public `r2.dev` URL or a custom domain: the backups are not encrypted.
2. **Key Vault:** put these secrets in the Umbraco DIS Key Vault for the environment (the one in the
   `umbraco-dis-vault` ConfigMap), in the portal or with `az keyvault secret set`. Not with Terraform: plan files
   would contain them.

   | Secret | Value |
   | --- | --- |
   | `R2Backup--AccessKeyId` | the token's Access Key ID |
   | `R2Backup--SecretAccessKey` | the token's Secret Access Key |
   | `R2Backup--Endpoint` | `https://<account-id>.eu.r2.cloudflarestorage.com` |

3. **Overlay:** add `../base/backup` and the `infoportal-backup` image to `syncroot/<env>/kustomization.yaml`,
   with a CronJob patch for the variables above (copy `syncroot/at22`).
4. **Image:** run the "Backup image build and publish" workflow with the tag from the overlay. The first time,
   check that the `infoportal-backup` package on GHCR is public, as `umbraco` is: the cluster pulls it through
   `altinncr.azurecr.io/ghcr.io/...`.
5. **Deploy:** run "Publish Syncroot artifacts" for the environment, with the Umbraco image tag that already
   runs there (otherwise Umbraco is redeployed too) and `AzureSQL`.
6. **Check:** the next morning, `backup-infoportal/restore.sh <env> --list` should show a new `.bacpac`, and
   `restore.sh <env> --import` should import it.

A new image version needs a new tag: publish it, then change `newTag` in the overlay and publish the syncroot.

## Updating tool versions

Change the `ARG`s in the `Dockerfile`. For rclone, take the checksum from the release's `SHA256SUMS`.
