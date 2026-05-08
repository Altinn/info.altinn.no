import type { APIRoute } from "astro";
import {
  configuredTextResponse,
  fetchSeoConfiguration,
  missingSeoConfigurationResponse,
} from "../../api/umbraco/seoHelpers";

export const GET: APIRoute = async ({ url }) => {
  const publicBaseUrl = url.origin;
  const seoConfig = await fetchSeoConfiguration();

  if (seoConfig) {
    const content = seoConfig.properties as Record<string, unknown> | undefined;
    const securityTxt = content?.securityTxtContent as string | undefined;
    if (securityTxt) {
      return configuredTextResponse(securityTxt, "text/plain; charset=utf-8", publicBaseUrl);
    }
  }

  return missingSeoConfigurationResponse("security.txt");
};
