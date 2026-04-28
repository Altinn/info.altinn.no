import { env } from "cloudflare:workers";
import type { ElasticsearchConfig } from "../../Services/Elasticsearch";

// API key is set as a Cloudflare secret on this Worker, currently with the
// suffixed name ELASTICSEARCH_API_KEY_INFOPORTAL_AT22 (the same name as the
// upstream GitHub Actions secret). The plain ELASTICSEARCH_API_KEY is checked
// first so renaming the Cloudflare secret later is a config-only change.
const elasticsearchApiKey =
  (env as Record<string, string | undefined>).ELASTICSEARCH_API_KEY ||
  (env as Record<string, string | undefined>).ELASTICSEARCH_API_KEY_INFOPORTAL_AT22 ||
  undefined;

export const elasticsearchConfig: ElasticsearchConfig = {
  url: env.ELASTICSEARCH_URL || "http://localhost:9200",
  indexPrefix: env.ELASTICSEARCH_INDEX_PREFIX || "infoportal",
  apiKey: elasticsearchApiKey,
};
