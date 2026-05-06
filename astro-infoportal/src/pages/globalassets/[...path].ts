import type { APIRoute } from "astro";
import { resolveUmbracoPublicUrl } from "../../api/umbraco/client";

export const ALL: APIRoute = async ({ request, url }) => {
  const targetUrl = new URL(url.pathname + url.search, resolveUmbracoPublicUrl());

  const proxyRequest = new Request(targetUrl, request);

  const response = await fetch(proxyRequest);

  return response;
};