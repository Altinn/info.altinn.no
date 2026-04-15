variable "environment" {
  description = "Environment name (e.g. test, prod)"
  type        = string
}

variable "location" {
  description = "Azure region for the Key Vault"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
}

variable "tenant_id" {
  description = "Azure tenant ID"
  type        = string
}

variable "terraform_object_id" {
  description = "Object ID of the Terraform identity, used to grant Key Vault Secrets Officer"
  type        = string
}

variable "eso_principal_id" {
  description = "Object ID of the ESO workload identity / managed identity that reads Key Vault secrets"
  type        = string
}

variable "elastic_cloud_api_key" {
  description = "Elastic Cloud API key for creating the serverless project"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to all taggable resources"
  type        = map(string)
  default     = {}
}
