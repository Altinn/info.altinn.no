variable "elastic_cloud_api_key" {
  description = "Elastic Cloud API key for creating the serverless project"
  type        = string
  sensitive   = true
}

variable "eso_principal_id" {
  description = "Object ID of the ESO workload identity / managed identity that reads Key Vault secrets"
  type        = string
}

