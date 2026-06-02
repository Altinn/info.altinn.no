resource "ec_organization" "main" {
  members = {
    "aas-bfred-prod@ai-dev.no" = {
      organization_role = "organization-admin"
    }
    "alv.gullbrand.lia@digdir.no" = {
      organization_role = "organization-admin"
    }
    "benjamin.brodie@digdir.no" = {
      organization_role = "none"
      project_elasticsearch_roles = [
        {
          project_ids = ["a61b244f20b14002a0bf4f35f0d643bc"]
          role        = "admin"
        }
      ]
    }
    "vu.quan@digdir.no" = {
      organization_role = "organization-admin"
    }
  }
}
