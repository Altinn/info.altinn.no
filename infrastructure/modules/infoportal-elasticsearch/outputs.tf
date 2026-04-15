output "key_vault_uri" {
  value = azurerm_key_vault.elasticsearch.vault_uri
}

output "elasticsearch_endpoint" {
  value     = ec_project_elasticsearch.search.elasticsearch_endpoint
  sensitive = true
}
