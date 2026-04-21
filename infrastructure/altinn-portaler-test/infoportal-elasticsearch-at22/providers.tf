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
    random = {
      source  = "hashicorp/random"
      version = "~> 3.8.1"
    }
  }

  backend "azurerm" {
    use_azuread_auth = true
  }
}

provider "ec" {
  apikey = var.elastic_cloud_api_key
}

provider "azurerm" {
  features {}
}
