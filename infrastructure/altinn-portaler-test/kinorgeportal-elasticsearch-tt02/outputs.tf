output "key_vault_name" {
  value = module.elasticsearch.key_vault_name
}

output "key_vault_uri" {
  value = module.elasticsearch.key_vault_uri
}

output "elasticsearch_endpoint" {
  value     = module.elasticsearch.elasticsearch_endpoint
  sensitive = true
}
