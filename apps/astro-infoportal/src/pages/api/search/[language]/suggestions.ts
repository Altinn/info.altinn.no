import type { APIRoute } from "astro";
import { elasticsearchConfig } from "../../../../api/elasticsearch/client";
import { getSuggestions } from "../../../../Services/Elasticsearch";

const SUPPORTED_LANGUAGES = new Set(["nb", "nn", "en"]);
const MAX_QUERY_LENGTH = 200;
const MIN_QUERY_LENGTH = 2;

export const GET: APIRoute = async ({ params, url }) => {
  const language = params.language ?? "";

  if (!SUPPORTED_LANGUAGES.has(language)) {
    return new Response(
      JSON.stringify({ error: `Unsupported language: ${language}` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const rawQuery = url.searchParams.get("q") ?? "";
  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);

  if (query.length < MIN_QUERY_LENGTH) {
    return new Response(JSON.stringify({ suggestions: [], totalHits: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const config = elasticsearchConfig;
  const result = await getSuggestions(config, query, language);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
