variable "umbraco_sp_object_id" {
  description = "Object ID of the Umbraco managed identity that reads/writes media files in the storage account. Leave empty to skip the role assignment."
  type        = string
  default     = ""
}
