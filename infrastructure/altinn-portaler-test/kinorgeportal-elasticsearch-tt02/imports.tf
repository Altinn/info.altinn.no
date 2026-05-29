import {
  to = azurerm_resource_group.main
  id = "/subscriptions/fdc58270-273a-4afc-b996-83e97fe5173a/resourceGroups/kinorgeportal-elasticsearch-tt02"
}

import {
  to = module.elasticsearch.azurerm_elastic_cloud_elasticsearch.search
  id = "/subscriptions/fdc58270-273a-4afc-b996-83e97fe5173a/resourceGroups/kinorgeportal-elasticsearch-tt02/providers/Microsoft.Elastic/monitors/kinorgeportal-elasticsearch-tt02"
}

import {
  to = module.elasticsearch.ec_elasticsearch_project.search
  id = "a61b244f20b14002a0bf4f35f0d643bc"
}
