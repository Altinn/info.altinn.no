import type { APIRoute } from "astro";
import { buildMunicipalitySearch } from "../../../api/umbraco/municipalitySearch";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const path = url.searchParams.get("path");
  const locale = url.searchParams.get("locale") ?? "nb";

  if (!path) {
    return new Response(JSON.stringify({ items: [] }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const { items } = await buildMunicipalitySearch(path, locale);

  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // The municipality/county tree under a schema page rarely changes;
      // let the edge cache the response so repeat visitors don't re-fetch.
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
};
