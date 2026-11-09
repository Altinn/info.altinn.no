# backup-infoportal

Nightly backup of the Umbraco database and media to Cloudflare R2, so info.altinn.no can be restored
outside Azure (plan C in `docs/reservelosning/`). Runs as a Kubernetes CronJob next to Umbraco in AKS.

**Status:** image and script are done and can be tested locally. Not done yet: CronJob in `syncroot/`,
the image publish workflow, the R2 buckets, and a restore script.

## What it does

```
CronJob (AKS, product-infoportal, workload identity)
  ├─ sqlpackage export ── Azure SQL (Private Link) ──► umbraco.bacpac
  │      └─ age encrypt (public key) ──► r2:infoportal-backup-{env}/db/umbraco-{env}-{time}.bacpac.age
  │                                     r2:infoportal-backup-{env}/db/latest.json
  └─ rclone sync ── Azure Blob (media) ──► r2:infoportal-snapshots-{env}/media/
```

- **Database:** the backup is encrypted to an age public key. The job can encrypt but cannot decrypt.
  Keep the private key outside Azure, for example in the team's password manager.
- **Retention:** handled by an R2 lifecycle rule on the bucket (for example delete `db/` after 30 days), not by the script.
- **Media:** mirrored into the snapshot bucket, where `cache-infoportal` can also serve it in fallback mode.
  `--max-delete` (default 200) stops the run instead of emptying the mirror if the source ever looks empty.
- **Failures:** the database and media parts run independently. If either fails, the script exits non-zero and the Job fails.

## Files

| File | Purpose |
| --- | --- |
| `Dockerfile` | .NET 10 runtime + sqlpackage, rclone, age, jq, curl (pinned versions, checksums verified) |
| `backup.sh` | The job. All configuration is documented at the top of the file. |
| `run-local.sh` | Runs the image on your machine against a real environment, writing to a local folder. |

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

## Configuration in the cluster

Set on the CronJob (see the header of `backup.sh` for all variables):

| Variable | Example (at22) | Source |
| --- | --- | --- |
| `ENV_NAME` | `at22` | overlay |
| `SQL_SERVER` | `${UMBRACO_SQL_CONN_FQDN}` | Flux substitution, as for Umbraco |
| `MEDIA_ACCOUNT` | `infoportalmediaat224w17` | overlay |
| `AGE_RECIPIENT` | `age1...` | overlay (public, not a secret) |
| `DB_TARGET` | `r2:infoportal-backup-at22/db` | overlay |
| `MEDIA_TARGET` | `r2:infoportal-snapshots-at22/media` | overlay |
| `RCLONE_CONFIG_R2_TYPE` | `s3` | base |
| `RCLONE_CONFIG_R2_PROVIDER` | `Cloudflare` | base |
| `RCLONE_CONFIG_R2_ENDPOINT` | `https://<account-id>.eu.r2.cloudflarestorage.com` | overlay |
| `RCLONE_CONFIG_R2_NO_CHECK_BUCKET` | `true` | base (the token cannot create buckets) |
| `RCLONE_CONFIG_R2_ACCESS_KEY_ID` / `..._SECRET_ACCESS_KEY` | | Key Vault → ExternalSecret |

The pod must run **without the Linkerd sidecar** (`linkerd.io/inject: disabled`). Otherwise the sidecar keeps
running after the script exits and the Job never completes.

## Updating tool versions

Change the `ARG`s in the `Dockerfile`. For rclone, take the checksum from the release's `SHA256SUMS`.
For age, download the release tarball and run `sha256sum` (age publishes `.proof` files, not a checksum list).
