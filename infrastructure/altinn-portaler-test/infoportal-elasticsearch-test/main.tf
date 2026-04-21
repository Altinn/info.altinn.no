data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "main" {
  name     = "infoportal-elasticsearch-test"
  location = "Germany West Central"
  tags     = local.tags
}

locals {
  tags = {
    finops_environment = "tt02"
    finops_product     = "infoportal"
    repository         = "https://github.com/Altinn/info.altinn.no"
    env                = "tt02"
    product            = "infoportal"
  }
}

module "elasticsearch" {
  source = "../../modules/infoportal-elasticsearch"

  environment                 = "tt02"
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  terraform_object_id         = data.azurerm_client_config.current.object_id
  eso_object_id               = var.eso_object_id
  elastic_cloud_api_key       = var.elastic_cloud_api_key
  elastic_cloud_email_address = var.elastic_cloud_email_address
  sku_name                    = var.sku_name
  elasticsearch_api_key       = var.elasticsearch_api_key
  tags                        = local.tags
}
