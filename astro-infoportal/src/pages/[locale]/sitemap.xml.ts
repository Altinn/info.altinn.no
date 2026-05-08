import type { APIRoute } from "astro";
import { seoCacheHeaders, unavailableSeoProxyResponse } from "../../api/umbraco/seoHelpers";
import { generateSitemapXml, parseSitemapLocale } from "../../api/umbraco/sitemap";

const SUPPORTED_LOCALES = new Set(["en", "nn"]);

export const GET: APIRoute = async ({ params, url }) => {
  const locale = parseSitemapLocale(params.locale);

  if (!locale || !SUPPORTED_LOCALES.has(locale)) {
    return new Response("sitemap.xml is not available for this locale.", {
      status: 404,
      headers: seoCacheHeaders(),
    });
  }

  let xml: string;

  try {
    xml = await generateSitemapXml(url.origin, locale);
  } catch {
    return unavailableSeoProxyResponse("sitemap.xml");
  }

  return new Response(xml, {
    headers: seoCacheHeaders("application/xml; charset=utf-8"),
  });
};