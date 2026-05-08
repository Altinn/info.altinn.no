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
    const content = seoConfig.properties as Record<string, unknown> | undefined;
    const llmsTxt = content?.llmsTxtContent as string | undefined;
    if (llmsTxt) {
      return configuredTextResponse(llmsTxt, "text/plain; charset=utf-8", publicBaseUrl);
    }
  }

  return missingSeoConfigurationResponse("llms.txt");
};
