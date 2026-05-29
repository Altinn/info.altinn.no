output "key_vault_name" {
  value = azurerm_key_vault.elasticsearch.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.elasticsearch.vault_uri
}

output "elasticsearch_endpoint" {
  value     = ec_elasticsearch_project.search.endpoints.elasticsearch
  sensitive = true
}
