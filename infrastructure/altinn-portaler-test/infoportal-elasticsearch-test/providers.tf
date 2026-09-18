terraform {
  required_version = ">= 1.14.0"

  required_providers {
    ec = {
      source  = "elastic/ec"
      version = "~> 0.12.5"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.74.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9.0"
    }
  }

  backend "azurerm" {
    use_azuread_auth     = true
    storage_account_name = ""
    container_name       = ""
    key                  = ""
  }
}

provider "ec" {
  apikey = var.elastic_cloud_api_key
}

provider "azurerm" {
  features {}
}
