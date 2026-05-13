output "storage_account_name" {
  description = "Name of the media storage account"
  value       = module.media_sa.storage_account_name
}

output "storage_account_id" {
  description = "Resource ID of the media storage account"
  value       = module.media_sa.storage_account_id
}

output "primary_blob_endpoint" {
  description = "Primary blob service endpoint URL"
  value       = module.media_sa.primary_blob_endpoint
}

output "backup_vault_id" {
  description = "Resource ID of the backup vault"
  value       = module.media_sa_backup.backup_vault_id
}
