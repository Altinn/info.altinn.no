resource "random_string" "keyvault_suffix" {
  length  = 4
  upper   = false
  special = false
}

resource "azurerm_key_vault" "elasticsearch" {
  name                       = "infoportal-es-${var.environment}-${random_string.keyvault_suffix.result}"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = var.tenant_id
  sku_name                   = "standard"
  rbac_authorization_enabled = true
  tags                       = var.tags
}

resource "azurerm_role_assignment" "terraform_keyvault_officer" {
  scope                = azurerm_key_vault.elasticsearch.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = var.terraform_object_id
}

resource "azurerm_role_assignment" "eso_keyvault_reader" {
  count                = var.eso_principal_id != "" ? 1 : 0
  scope                = azurerm_key_vault.elasticsearch.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = var.eso_principal_id
}

resource "azurerm_elastic_cloud_elasticsearch" "search" {
  name                        = "infoportal-search-${var.environment}"
  resource_group_name         = var.resource_group_name
  location                    = var.location
  sku_name                    = var.sku_name
  elastic_cloud_email_address = var.elastic_cloud_email_address
  tags                        = var.tags
}

resource "ec_elasticsearch_project" "search" {
  name      = "infoportal-search-${var.environment}"
  region_id = "azure-germanywestcentral"
}

resource "azurerm_key_vault_secret" "es_endpoint" {
  name         = "elasticsearch-endpoint"
  value        = ec_elasticsearch_project.search.endpoints.elasticsearch
  key_vault_id = azurerm_key_vault.elasticsearch.id
  tags         = var.tags

  depends_on = [azurerm_role_assignment.terraform_keyvault_officer]
}

resource "azurerm_key_vault_secret" "es_api_key" {
  name         = "elasticsearch-api-key"
  value        = var.elasticsearch_api_key
  key_vault_id = azurerm_key_vault.elasticsearch.id
  tags         = var.tags

  depends_on = [azurerm_role_assignment.terraform_keyvault_officer]
}
