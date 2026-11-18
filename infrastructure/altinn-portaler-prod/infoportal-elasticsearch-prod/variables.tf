variable "elastic_cloud_api_key" {
  description = "Elastic Cloud API key for authenticating the elastic/ec provider. Ephemeral, so saved plans do not store it."
  type        = string
  sensitive   = true
  ephemeral   = true
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
  description = "Elasticsearch API key for the elasticstack provider (base64 encoded id:api_key), created once in the Elastic Cloud console. Ephemeral, so saved plans and state do not store it."
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "elasticsearch_api_key_version" {
  description = "Number from the SHA-256 of elasticsearch_api_key, set by the workflow. It changes with the key, so Terraform writes the new key to Key Vault."
  type        = number
}

variable "eso_object_id" {
  description = "Object ID of the ESO workload identity / managed identity that reads Key Vault secrets. Leave empty to skip the role assignment."
  type        = string
  default     = ""
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access the Elasticsearch project. Empty list allows all traffic."
  type        = list(string)
  default     = []
}
