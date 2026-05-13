output "backup_vault_id" {
  description = "Resource ID of the backup vault"
  value       = azurerm_data_protection_backup_vault.media.id
}

output "backup_vault_principal_id" {
  description = "Principal ID of the backup vault's system-assigned managed identity"
  value       = azurerm_data_protection_backup_vault.media.identity[0].principal_id
}
