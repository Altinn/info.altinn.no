# infoportal-elasticsearch-test

Provisions an Azure Native Elastic monitor, an Elastic Cloud Serverless project, and an Azure Key Vault for the Umbraco search integration.

## What this creates

- **Azure Resource Group** `infoportal-elasticsearch-test`
- **Azure Native Elastic monitor** `infoportal-search-tt02` — links Azure billing to Elastic Cloud
- **Elastic Cloud Serverless project** `infoportal-search-tt02` (region: `azure-germanywestcentral`)
- **Azure Key Vault** `infoportal-es-tt02-<random>` — stores Elasticsearch credentials
- Two Key Vault secrets: `elasticsearch-endpoint` and `elasticsearch-api-key`
- RBAC role assignment granting ESO's identity `Key Vault Secrets User` on the vault (optional, set `eso_principal_id` to enable)

## Configuring Umbraco

After applying this Terraform, wire the credentials into the Umbraco deployment using External Secrets Operator.

### 1. SecretStore

Add a `SecretStore` to the Umbraco syncroot pointing at the Key Vault. The vault URL can be found in the Terraform output `key_vault_uri`:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: elasticsearch-keyvault
spec:
  provider:
    azurekv:
      authType: WorkloadIdentity
      vaultUrl: "https://infoportal-es-tt02-<random>.vault.azure.net"
      serviceAccountRef:
        name: umbraco
```

### 2. ExternalSecret

Add an `ExternalSecret` that pulls both secrets into a Kubernetes Secret named `elasticsearch`:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: elasticsearch
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: elasticsearch-keyvault
    kind: SecretStore
  target:
    name: elasticsearch
    creationPolicy: Owner
  data:
    - secretKey: endpoint
      remoteRef:
        key: elasticsearch-endpoint
    - secretKey: api-key
      remoteRef:
        key: elasticsearch-api-key
```

### 3. Deployment env vars

Reference the secret from the Umbraco `Deployment`:

```yaml
env:
  - name: Elasticsearch__Endpoint
    valueFrom:
      secretKeyRef:
        name: elasticsearch
        key: endpoint
  - name: Elasticsearch__ApiKey
    valueFrom:
      secretKeyRef:
        name: elasticsearch
        key: api-key
```

### 4. ServiceAccount

The `umbraco` ServiceAccount must have the workload identity annotation for the identity that was granted `Key Vault Secrets User` above (`var.eso_principal_id`).

## Deploying

Non-sensitive values are configured in `terraform.tfvars`. The two keys are ephemeral variables, so Terraform stores them in neither saved plans nor state. Provide them through the environment for both plan and apply. The version tells Terraform when the Elasticsearch API key has changed; derive it from the key the same way the workflow does:

```bash
export TF_VAR_elastic_cloud_api_key="<your-elastic-cloud-api-key>"
export TF_VAR_elasticsearch_api_key="<encoded-elasticsearch-api-key>"
export TF_VAR_elasticsearch_api_key_version=$((16#$(printf '%s' "$TF_VAR_elasticsearch_api_key" | sha256sum | cut -c1-12)))

terraform init
terraform plan
terraform apply
```

To enable the ESO Key Vault role assignment, pass the ESO identity object ID:

```bash
terraform apply -var="eso_principal_id=<object-id>"
```

Or add it to `terraform.tfvars`.
