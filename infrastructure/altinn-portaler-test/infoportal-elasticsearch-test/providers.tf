terraform {
  required_version = "~> 1.14.8"

  required_providers {
    ec = {
      source  = "elastic/ec"
      version = "~> 0.12.5"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.68.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "infoportal-elasticsearch-test"
    storage_account_name = "infoportaltfstate"
    container_name       = "tfstate"
    key                  = "infoportal-elasticsearch-test.tfstate"
  }
}

provider "ec" {
  apikey = var.elastic_cloud_api_key
}

provider "azurerm" {
  features {}
}
