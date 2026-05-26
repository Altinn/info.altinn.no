import { env } from "cloudflare:workers";
import type { PlatformEndpoints } from "./environments";
import { resolveEnvironment } from "./environments";

export interface AltinnPlatformConfig {
  endpoints: PlatformEndpoints;
  subscriptionKey?: string;
  subscriptionKeyHeaderName: string;
  jwtCookieName: string;
  partyUuidCookieName: string;
  // Feature flags, set via wrangler/env vars (mirror AM UI's per-env FeatureFlags).
  useNewActorList: boolean;
  // Turn off after the Altinn 2 shutdown (2026-06-19).
  routeChangeReporteeViaAltinn2: boolean;
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
    useNewActorList: env.USE_NEW_ACTOR_LIST === "true",
    routeChangeReporteeViaAltinn2:
      env.ROUTE_CHANGE_REPORTEE_VIA_ALTINN2 !== "false",
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
