terraform {
  required_providers {
    azurerm = {
      source                = "hashicorp/azurerm"
      configuration_aliases = [azurerm.source]
    }
  }
}

# Vault and policy live in the backup subscription (default provider)
resource "azurerm_data_protection_backup_vault" "media" {
  name                = var.backup_vault_name
  resource_group_name = var.resource_group_name
  location            = var.location
  datastore_type      = "OperationalStore"
  redundancy          = "ZoneRedundant"

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

resource "azurerm_data_protection_backup_policy_blob_storage" "media" {
  name     = "blob-backup-policy"
  vault_id = azurerm_data_protection_backup_vault.media.id

  operational_default_retention_duration = "P${var.backup_retention_days}D"
}

# Role assignment scoped to the storage account in the source subscription
resource "azurerm_role_assignment" "backup_vault_sa_contributor" {
  provider             = azurerm.source
  scope                = var.storage_account_id
  role_definition_name = "Storage Account Backup Contributor"
  principal_id         = azurerm_data_protection_backup_vault.media.identity[0].principal_id
}

resource "azurerm_management_lock" "backup_vault" {
  name       = "${var.backup_vault_name}-lock"
  scope      = azurerm_data_protection_backup_vault.media.id
  lock_level = "CanNotDelete"
}

# Backup instance is created in the vault subscription but references the cross-subscription storage account
resource "azurerm_data_protection_backup_instance_blob_storage" "media" {
  name               = "${var.backup_vault_name}-instance"
  location           = var.location
  vault_id           = azurerm_data_protection_backup_vault.media.id
  storage_account_id = var.storage_account_id
  backup_policy_id   = azurerm_data_protection_backup_policy_blob_storage.media.id

  depends_on = [azurerm_role_assignment.backup_vault_sa_contributor]
}
