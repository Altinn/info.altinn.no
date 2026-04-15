resource "azurerm_key_vault" "elasticsearch" {
  name                      = "infoportal-es-${var.environment}"
  location                  = var.location
  resource_group_name       = var.resource_group_name
  tenant_id                 = var.tenant_id
  sku_name                  = "standard"
  enable_rbac_authorization = true
}

resource "azurerm_role_assignment" "terraform_keyvault_officer" {
  scope                = azurerm_key_vault.elasticsearch.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = var.terraform_object_id
}

resource "azurerm_role_assignment" "eso_keyvault_reader" {
  scope                = azurerm_key_vault.elasticsearch.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = var.eso_principal_id
}

resource "ec_project_elasticsearch" "search" {
  name      = "infoportal-search-${var.environment}"
  region_id = "azure-norwayeast"
}

resource "azurerm_key_vault_secret" "es_endpoint" {
  name         = "elasticsearch-endpoint"
  value        = ec_project_elasticsearch.search.elasticsearch_endpoint
  key_vault_id = azurerm_key_vault.elasticsearch.id
}

resource "azurerm_key_vault_secret" "es_api_key" {
  name         = "elasticsearch-api-key"
  value        = ec_project_elasticsearch.search.credentials[0].api_key
  key_vault_id = azurerm_key_vault.elasticsearch.id
}
