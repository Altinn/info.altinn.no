variable "elastic_cloud_api_key" {
  description = "Elastic Cloud API key for authenticating the elastic/ec provider"
  type        = string
  sensitive   = true
}

variable "elastic_cloud_email_address" {
  description = "Email address associated with the Elastic Cloud account"
  type        = string
}

variable "sku_name" {
  description = "SKU name for the Elastic Cloud Elasticsearch resource"
  type        = string
}

variable "elasticsearch_endpoint" {
  description = "Elasticsearch endpoint URL for the serverless project, used to configure the elasticstack provider"
  type        = string
}

variable "elasticsearch_api_key" {
  description = "Elasticsearch API key for the elasticstack provider (base64 encoded id:api_key), created once in the Elastic Cloud console"
  type        = string
  sensitive   = true
}

variable "eso_principal_id" {
  description = "Object ID of the ESO workload identity / managed identity that reads Key Vault secrets. Leave empty to skip the role assignment."
  type        = string
  default     = ""
}
