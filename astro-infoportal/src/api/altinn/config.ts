import { env } from "cloudflare:workers";
import type { PlatformEndpoints } from "./environments";
import { resolveEnvironment } from "./environments";

export interface AltinnPlatformConfig {
  endpoints: PlatformEndpoints;
  subscriptionKey?: string;
  subscriptionKeyHeaderName: string;
  jwtCookieName: string;
  partyUuidCookieName: string;
}

export function getAltinnPlatformConfig(
  hostname: string | null | undefined,
): AltinnPlatformConfig {
  const endpoints = resolveEnvironment(hostname);
  return {
    endpoints,
    subscriptionKey: env.ALTINN_SUBSCRIPTION_KEY || undefined,
    subscriptionKeyHeaderName:
      env.ALTINN_SUBSCRIPTION_KEY_HEADER_NAME || "Ocp-Apim-Subscription-Key",
    jwtCookieName: env.ALTINN_JWT_COOKIE_NAME || "AltinnStudioRuntime",
    partyUuidCookieName: env.ALTINN_PARTY_UUID_COOKIE_NAME || "AltinnPartyUuid",
  };
}

export function getProfileApiBaseUrl(config: AltinnPlatformConfig): string {
  return `${config.endpoints.platformBaseUrl.replace(/\/$/, "")}/profile/api/v1`;
}

export function getAccessManagementApiBaseUrl(
  config: AltinnPlatformConfig,
): string {
  return `${config.endpoints.platformBaseUrl.replace(/\/$/, "")}/accessmanagement/api/v1`;
}
