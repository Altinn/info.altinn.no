elastic_cloud_email_address = "aas-bfred-prod@ai-dev.no"
sku_name                    = "ess-consumption-2024_Monthly@TIDn7ja87drquhy"
elasticsearch_endpoint      = "https://infoportal-search-prod-adac85.es.germanywestcentral.azure.elastic.cloud"
eso_object_id               = "8b43f887-3962-4cc4-ad7b-fba8ebf3b70b" # infop-prod-hxhapc-sql-uami

allowed_cidr_blocks = [
  # BEGIN CLOUDFLARE
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
  # END CLOUDFLARE

  # dis-core-prod AKS egress prefixes
  "20.251.69.80/28",
]
