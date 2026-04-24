resource "azurerm_resource_group" "main" {
  name     = "infoportal-media-sa-at23"
  location = "Norway East"
  tags     = local.tags
}

locals {
  tags = {
    finops_environment = "at23"
    finops_product     = "infoportal"
    repository         = "https://github.com/Altinn/info.altinn.no"
    env                = "at23"
    product            = "infoportal"
  }
}

module "media_sa" {
  source = "../../modules/infoportal-media-sa"

  environment               = "at23"
  location                  = azurerm_resource_group.main.location
  resource_group_name       = azurerm_resource_group.main.name
  storage_account_base_name = "infoportalmediaat23"
  umbraco_sp_object_id      = var.umbraco_sp_object_id
  tags                      = local.tags
}
