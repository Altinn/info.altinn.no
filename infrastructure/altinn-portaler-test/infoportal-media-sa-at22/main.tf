resource "azurerm_resource_group" "main" {
  name     = "infoportal-media-sa-at22"
  location = "Norway East"
  tags     = local.tags
}

locals {
  tags = {
    finops_environment = "at22"
    finops_product     = "infoportal"
    repository         = "https://github.com/Altinn/info.altinn.no"
    env                = "at22"
    product            = "infoportal"
  }
}

module "media_sa" {
  source = "../../modules/infoportal-media-sa"

  environment               = "at22"
  location                  = azurerm_resource_group.main.location
  resource_group_name       = azurerm_resource_group.main.name
  storage_account_base_name = "infoportalmediaat22"
  umbraco_sp_object_id      = var.umbraco_sp_object_id
  tags                      = local.tags
}
