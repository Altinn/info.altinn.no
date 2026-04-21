# infoportal-media-sa-at22

Provisions an Azure Storage Account for Umbraco CMS media file storage in the AT22 environment.

## What this creates

- **Azure Resource Group** `infoportal-media-sa-at22`
- **Azure Storage Account** `infoportalmediaat22<random>` (Standard ZRS, Norway East)
  - Shared key access disabled — workload identity only
  - Blob versioning enabled
- **Blob container** `umbraco` — holds Umbraco's `/media` and `/cache` folders
- RBAC role assignment granting `Storage Blob Data Contributor` to the Umbraco service principal (optional, set `umbraco_sp_object_id` to enable)

## Configuring Umbraco

Umbraco connects to the storage account using AKS Workload Identity via `DefaultAzureCredential` — no connection strings or secrets required.

### 1. Enable the role assignment

Set `umbraco_sp_object_id` in `terraform.tfvars` to the object ID of the Umbraco pod's managed identity:

```hcl
umbraco_sp_object_id = "<object-id>"
```

### 2. Kustomization env var

The blob service URI is injected as an environment variable via the kustomization patch. The storage account name is available in the Terraform output `storage_account_name`.

```yaml
- name: Umbraco__Storage__AzureBlob__Media__ConnectionString
  value: https://<storage-account-name>.blob.core.windows.net
```

The container name defaults to `umbraco` and can be set similarly via `Umbraco__Storage__AzureBlob__Media__ContainerName` if needed.

### 3. Composer

Add a composer to configure `DefaultAzureCredential` instead of a connection string key:

```csharp
using Azure.Identity;
using Azure.Storage.Blobs;
using Umbraco.Cms.Core.Composing;
using Umbraco.StorageProviders.AzureBlob.IO;

internal sealed class AzureBlobFileSystemComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
        => builder.AddAzureBlobMediaFileSystem(options =>
        {
            options.TryCreateBlobContainerClientUsingUri(uri =>
                new BlobContainerClient(uri, new DefaultAzureCredential()));
        })
        .AddAzureBlobImageSharpCache();
}
```

This replaces the `.AddAzureBlobMediaFileSystem()` call in `Program.cs` if already present.

### 4. NuGet packages

```
Umbraco.StorageProviders.AzureBlob
Azure.Identity
```

## Deploying

Non-sensitive values are configured in `terraform.tfvars`. Run:

```bash
terraform init
terraform plan
terraform apply
```

To enable the role assignment for the Umbraco workload identity, set `umbraco_sp_object_id` in `terraform.tfvars` before applying.
