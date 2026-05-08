import type { APIRoute } from "astro";
import {
  configuredTextResponse,
  fetchSeoConfiguration,
  missingSeoConfigurationResponse,
} from "../api/umbraco/seoHelpers";

export const GET: APIRoute = async ({ url }) => {
  const publicBaseUrl = url.origin;
  const seoConfig = await fetchSeoConfiguration();

  if (seoConfig) {
    const content =
      (seoConfig as Record<string, unknown>).properties as Record<string, unknown> | undefined;
    const robotsTxt = content?.robotsTxtContent as string | undefined;
    if (robotsTxt) {
      return configuredTextResponse(robotsTxt, "text/plain; charset=utf-8", publicBaseUrl);
    }
  }

  return missingSeoConfigurationResponse("robots.txt");
};
