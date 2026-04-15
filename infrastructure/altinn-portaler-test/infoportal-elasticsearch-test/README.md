# infoportal-elasticsearch-test

Provisions an Elastic Cloud Serverless project and an Azure Key Vault for the Umbraco search integration.

## What this creates

- **Azure Key Vault** `infoportal-es-test` — stores Elasticsearch credentials
- **Elastic Cloud Serverless project** `infoportal-search-test` (region: `azure-norwayeast`)
- Two Key Vault secrets: `elasticsearch-endpoint` and `elasticsearch-api-key`
- RBAC role assignment granting ESO's identity `Key Vault Secrets User` on the vault

## Configuring Umbraco

After applying this Terraform, wire the credentials into the Umbraco deployment using External Secrets Operator.

### 1. SecretStore

Add a `SecretStore` to the Umbraco syncroot pointing at the Key Vault:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: elasticsearch-keyvault
spec:
  provider:
    azurekv:
      authType: WorkloadIdentity
      vaultUrl: "https://infoportal-es-test.vault.azure.net"
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

```bash
export EC_API_KEY="<your-elastic-cloud-api-key>"

terraform init
terraform plan -var="eso_principal_id=<object-id>"
terraform apply -var="eso_principal_id=<object-id>"
```

`elastic_cloud_api_key` can also be passed via `-var` or a `terraform.tfvars` file instead of the environment variable.
