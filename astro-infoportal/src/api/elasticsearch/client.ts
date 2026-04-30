import { env } from "cloudflare:workers";
import type { ElasticsearchConfig } from "../../Services/Elasticsearch";

const elasticsearchApiKey =
  (env as Record<string, string | undefined>).ELASTICSEARCH_API_KEY || undefined;

export const elasticsearchConfig: ElasticsearchConfig = {
  url: env.ELASTICSEARCH_URL || "http://localhost:9200",
  indexPrefix: env.ELASTICSEARCH_INDEX_PREFIX || "infoportal",
  apiKey: elasticsearchApiKey,
};
