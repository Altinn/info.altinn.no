import type { APIRoute } from "astro";
import { seoCacheHeaders, unavailableSeoProxyResponse } from "../api/umbraco/seoHelpers";
import { generateSitemapXml } from "../api/umbraco/sitemap";

export const GET: APIRoute = async ({ url }) => {
  let xml: string;

  try {
    xml = await generateSitemapXml(url.origin);
  } catch {
    return unavailableSeoProxyResponse("sitemap.xml");
  }

  return new Response(xml, {
    headers: seoCacheHeaders("application/xml; charset=utf-8"),
  });
};
