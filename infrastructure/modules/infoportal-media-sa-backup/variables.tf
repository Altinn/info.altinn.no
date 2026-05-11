variable "storage_account_id" {
  description = "Resource ID of the storage account to protect (in the source subscription)"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group in the backup subscription where the vault will be created"
  type        = string
}

variable "location" {
  description = "Azure region — must match the storage account's region"
  type        = string
}

variable "backup_vault_name" {
  description = "Name for the backup vault"
  type        = string
}

variable "backup_retention_days" {
  description = "Number of days to retain operational blob backups (1–360)"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to all taggable resources"
  type        = map(string)
  default     = {}
}
