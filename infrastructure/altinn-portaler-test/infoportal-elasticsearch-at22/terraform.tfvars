elastic_cloud_email_address = "aas-bfred-prod@ai-dev.no"
sku_name                    = "ess-consumption-2024_Monthly@TIDn7ja87drquhy"
elasticsearch_endpoint      = "https://infoportal-search-at22-f6bd85.es.germanywestcentral.azure.elastic.cloud"
eso_object_id               = "37bad695-20a0-4b9c-8374-bd182c5cdad4"

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
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
  # END CLOUDFLARE

  # dis-core-at22 AKS egress prefixes
  "4.177.14.48/28",
  "2603:1020:e01:4::350/124",
]
