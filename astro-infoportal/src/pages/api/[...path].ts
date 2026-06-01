import type { APIRoute } from "astro";
import { UMBRACO_API_URL } from "../../api/umbraco/client";

function resolveBackend(refererHeader: string | null): string {
  if (!refererHeader) {
    return UMBRACO_API_URL;
  }

  let refererPath: string;
  try {
    refererPath = new URL(refererHeader).pathname;
  } catch {
    return UMBRACO_API_URL;
  }

  return UMBRACO_API_URL;
}

export const ALL: APIRoute = async ({ request, url }) => {
  const backend = resolveBackend(request.headers.get("referer"));
  const targetUrl = new URL(url.pathname + url.search, backend);

  const proxyRequest = new Request(targetUrl, request);

  const response = await fetch(proxyRequest);

  return response;
};
