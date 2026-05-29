terraform {
  required_providers {
    ec = {
      source = "elastic/ec"
    }
    azurerm = {
      source = "hashicorp/azurerm"
    }
    random = {
      source = "hashicorp/random"
    }
  }
}
