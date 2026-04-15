data "azurerm_client_config" "current" {}

data "azurerm_resource_group" "main" {
  name = "infoportal-elasticsearch-test"
}

module "elasticsearch" {
  source = "../../modules/infoportal-elasticsearch"

  environment           = "test"
  location              = data.azurerm_resource_group.main.location
  resource_group_name   = data.azurerm_resource_group.main.name
  tenant_id             = data.azurerm_client_config.current.tenant_id
  terraform_object_id   = data.azurerm_client_config.current.object_id
  eso_principal_id      = var.eso_principal_id
  elastic_cloud_api_key = var.elastic_cloud_api_key
}
