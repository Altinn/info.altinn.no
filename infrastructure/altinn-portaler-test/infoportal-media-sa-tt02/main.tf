resource "azurerm_resource_group" "main" {
  name     = "infoportal-media-sa-tt02"
  location = "Norway East"
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

module "media_sa" {
  source = "../../modules/infoportal-media-sa"

  environment                       = "tt02"
  location                          = azurerm_resource_group.main.location
  resource_group_name               = azurerm_resource_group.main.name
  storage_account_base_name         = "infoportalmediatt02"
  umbraco_sp_object_id              = var.umbraco_sp_object_id
  blob_reader_group_object_ids      = var.blob_reader_group_object_ids
  blob_contributor_group_object_ids = var.blob_contributor_group_object_ids
  tags                              = local.tags
}
