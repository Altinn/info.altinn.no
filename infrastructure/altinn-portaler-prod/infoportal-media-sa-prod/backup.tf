resource "azurerm_resource_group" "backup" {
  provider = azurerm.backup
  name     = "infoportal-media-sa-backup-prod"
  location = "Norway East"
  tags     = local.tags
}

module "media_sa_backup" {
  source = "../../modules/infoportal-media-sa-backup"

  providers = {
    azurerm        = azurerm.backup
    azurerm.source = azurerm
  }

  storage_account_id    = module.media_sa.storage_account_id
  resource_group_name   = azurerm_resource_group.backup.name
  location              = azurerm_resource_group.backup.location
  backup_vault_name     = "infoportal-media-bvault-prod"
  backup_retention_days = 30
  tags                  = local.tags
}
