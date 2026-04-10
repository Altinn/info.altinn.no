import type { APIRoute } from "astro";
import { UMBRACO_API_URL } from "../../api/umbraco/client";

export const ALL: APIRoute = async ({ request, url }) => {
  const targetUrl = new URL(url.pathname + url.search, UMBRACO_API_URL);

  const proxyRequest = new Request(targetUrl, request);

  const response = await fetch(proxyRequest);

  return response;
};
