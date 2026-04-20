import type { APIRoute } from "astro";
import { elasticsearchConfig } from "../../../../api/elasticsearch/client";
import { searchPages } from "../../../../Services/Elasticsearch";

const SUPPORTED_LANGUAGES = new Set(["nb", "nn", "en"]);
const MAX_PAGE_NUMBER = 100;
const MAX_QUERY_LENGTH = 200;
const DEFAULT_PAGE_SIZE = 10;

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

  if (!query) {
    return new Response(JSON.stringify({ currentPageNumber: 1 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawPage = parseInt(url.searchParams.get("pagenumber") ?? "1", 10);
  const pageNumber = Math.min(
    Math.max(Number.isNaN(rawPage) ? 1 : rawPage, 1),
    MAX_PAGE_NUMBER,
  );
  const context = url.searchParams.get("context") ?? undefined;

  const result = await searchPages(
    elasticsearchConfig,
    query,
    language,
    pageNumber,
    DEFAULT_PAGE_SIZE,
    context,
  );

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
