# backup-infoportal

Nightly backup of the Umbraco database and media to Cloudflare R2, so info.altinn.no can be restored
outside Azure (plan C in `docs/reservelosning/`). Runs as a Kubernetes CronJob next to Umbraco in AKS.

**Status:** image, backup script and restore script are done and tested from a local machine against at22
and the R2 bucket `infoportal-backup-at22`. Not done yet: CronJob in `syncroot/` and the image publish workflow.

## What it does

```
CronJob (AKS, product-infoportal, workload identity)
  ├─ sqlpackage export ── Azure SQL (Private Link) ──► umbraco.bacpac
  │      └─ age encrypt (public key) ──► r2:infoportal-backup-{env}/db/umbraco-{env}-{time}.bacpac.age
  │                                     r2:infoportal-backup-{env}/db/latest.json
  └─ rclone sync ── Azure Blob (media) ──► r2:infoportal-backup-{env}/media/
                                           (deleted/changed files ──► r2:infoportal-backup-{env}/media-deleted/{time}/)
```

- **Database:** the backup is encrypted to an age public key. The job can encrypt but cannot decrypt.
  Keep the private key outside Azure, for example in the team's password manager.
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
| `Dockerfile` | .NET 10 runtime + sqlpackage, rclone, age, jq, curl (pinned versions, checksums verified) |
| `backup.sh` | The job. All configuration is documented at the top of the file. |
| `run-local.sh` | Runs the image on your machine against a real environment, writing to a local folder or R2 (`--to-r2`). |
| `restore.sh` | Downloads a database backup from R2, checks it against `latest.json`, decrypts it, and optionally imports it locally. |

## Test locally

Needs the same access as `scripts/db` (VPN, `az login`, Entra group for SQL), and a role on the media
storage account that allows a user delegation SAS (the same as `scripts/blobs`).

```bash
backup-infoportal/run-local.sh at22               # database + media
backup-infoportal/run-local.sh at22 --skip-media  # database only
```

Output goes to `~/infoportal-backup-test/at22/` (outside the repo: it contains real data and a test key).
Check that the backup can be decrypted and imported:

```bash
age --decrypt -i ~/infoportal-backup-test/at22/age-key.txt \
  -o /tmp/umbraco.bacpac ~/infoportal-backup-test/at22/db/umbraco-at22-*.bacpac.age
```

then `scripts/db/import-bacpac.sh` as usual.

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
backup-infoportal/restore.sh at22                # download latest, verify, decrypt
backup-infoportal/restore.sh at22 --import       # ... and import into the local SQL Server
backup-infoportal/restore.sh at22 --list         # list database backups
```

The SQL server must be reached on its private address. Two things can go wrong, typically with Tailscale in WSL:

| Symptom | Cause | Fix |
| --- | --- | --- |
| "Deny Public Network Access is set to Yes" | WSL's DNS returns the public address, not Tailscale's | `--dns 100.100.100.100` |
| "an error occurred during the login process", retried for minutes | WSL's `eth0` has MTU 1280, so full-size Tailscale packets are lost. The login carries the Entra token and is the first large packet. | `--mtu 1200` |

`--tailscale` does both.

## Configuration in the cluster

Set on the CronJob (see the header of `backup.sh` for all variables):

| Variable | Example (at22) | Source |
| --- | --- | --- |
| `ENV_NAME` | `at22` | overlay |
| `SQL_SERVER` | `${UMBRACO_SQL_CONN_FQDN}` | Flux substitution, as for Umbraco |
| `MEDIA_ACCOUNT` | `infoportalmediaat224w17` | overlay |
| `AGE_RECIPIENT` | `age1...` | overlay (public, not a secret) |
| `DB_TARGET` | `r2:infoportal-backup-at22/db` | overlay |
| `MEDIA_TARGET` | `r2:infoportal-backup-at22/media` | overlay |
| `MEDIA_DELETED_TARGET` | `r2:infoportal-backup-at22/media-deleted` | overlay |
| `RCLONE_CONFIG_R2_TYPE` | `s3` | base |
| `RCLONE_CONFIG_R2_PROVIDER` | `Cloudflare` | base |
| `RCLONE_CONFIG_R2_ENDPOINT` | `https://<account-id>.eu.r2.cloudflarestorage.com` | overlay |
| `RCLONE_CONFIG_R2_NO_CHECK_BUCKET` | `true` | base (the token cannot create buckets) |
| `RCLONE_CONFIG_R2_STORAGE_CLASS` | `STANDARD` | base. Without it, rclone passes the Azure tier (`Hot`) on as storage class and R2 rejects every upload. |
| `RCLONE_CONFIG_R2_ACCESS_KEY_ID` / `..._SECRET_ACCESS_KEY` | | Key Vault → ExternalSecret. Put the value in Key Vault by hand or with `az`, not with Terraform: plan files would contain it. |

The pod must run **without the Linkerd sidecar** (`linkerd.io/inject: disabled`). Otherwise the sidecar keeps
running after the script exits and the Job never completes.

## Updating tool versions

Change the `ARG`s in the `Dockerfile`. For rclone, take the checksum from the release's `SHA256SUMS`.
For age, download the release tarball and run `sha256sum` (age publishes `.proof` files, not a checksum list).
