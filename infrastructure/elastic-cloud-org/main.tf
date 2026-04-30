resource "ec_organization" "main" {
  members = {
    "aas-bfred-prod@ai-dev.no" = {
      organization_role = "organization-admin"
    }
    "alv.gullbrand.lia@digdir.no" = {
      organization_role = "organization-admin"
    }
    "vu.quan@digdir.no" = {
      organization_role = "organization-admin"
    }
  }
}
