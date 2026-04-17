resource "random_string" "storage_suffix" {
  length  = 4
  upper   = false
  special = false
}

resource "azurerm_storage_account" "media" {
  name                     = "${var.storage_account_base_name}${random_string.storage_suffix.result}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  account_kind             = "StorageV2"

  blob_properties {
    versioning_enabled = true
  }

  tags = var.tags
}

resource "azurerm_storage_container" "media" {
  name                  = "media"
  storage_account_id    = azurerm_storage_account.media.id
  container_access_type = "private"
}

resource "azurerm_role_assignment" "umbraco_blob_contributor" {
  count                = var.umbraco_sp_object_id != "" ? 1 : 0
  scope                = azurerm_storage_account.media.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = var.umbraco_sp_object_id
}
