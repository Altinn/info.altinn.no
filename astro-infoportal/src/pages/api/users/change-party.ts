import type { APIRoute } from "astro";
import {
  altinnPlatformFetch,
  getAuthContext,
  isValidUuid,
} from "../../../api/altinn/client";
import { getAccessManagementApiBaseUrl } from "../../../api/altinn/config";
import type { AuthorizedParty } from "../../../api/altinn/types";

export const prerender = false;

// Altinn 3 reportee switch: no platform endpoint exists, so replicate AM's
// ReporteeController (PR #2167) — validate via authorizedparties, set cookies here.

// Redirect allowlist (mirrors PR #2167): host equals or ends with one of these.
const ALLOWED_REDIRECT_DOMAINS = ["altinn.no", "altinn.cloud", "localhost"];

function isAllowedRedirect(target: string): boolean {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_REDIRECT_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

function findParty(
  parties: AuthorizedParty[],
  partyUuid: string,
): AuthorizedParty | null {
  for (const party of parties) {
    if (party.partyUuid === partyUuid) return party;
    if (party.subunits && party.subunits.length > 0) {
      const found = findParty(party.subunits, partyUuid);
      if (found) return found;
    }
  }
  return null;
}

export const GET: APIRoute = async ({ request }) => {
  const auth = getAuthContext(request);
  const requestUrl = new URL(request.url);
  const partyUuid = requestUrl.searchParams.get("partyUuid") ?? "";
  const goTo = requestUrl.searchParams.get("goTo") ?? "";

  const fallback = auth.config.endpoints.hostBaseUrl;
  const redirectTarget = isAllowedRedirect(goTo) ? goTo : fallback;

  if (!auth.isAuthenticated || !isValidUuid(partyUuid)) {
    return Response.redirect(redirectTarget, 302);
  }

  try {
    const url = new URL(
      `${getAccessManagementApiBaseUrl(auth.config)}/authorizedparties`,
    );
    url.searchParams.set("includeAltinn2", "true");
    url.searchParams.set("includeRoles", "false");
    url.searchParams.set("includeAccessPackages", "false");
    url.searchParams.set("includeResources", "false");
    url.searchParams.set("includeInstances", "false");

    const response = await altinnPlatformFetch(auth, url.toString());
    if (!response || !response.ok) {
      return Response.redirect(redirectTarget, 302);
    }

    const parties = (await response.json()) as AuthorizedParty[] | null;
    const party = findParty(parties ?? [], partyUuid);
    if (!party) {
      return Response.redirect(redirectTarget, 302);
    }

    const cookieDomain = new URL(auth.config.endpoints.hostBaseUrl).hostname;
    const secure = cookieDomain !== "localhost";
    const attributes = `Path=/; Domain=${cookieDomain}; SameSite=Lax${
      secure ? "; Secure" : ""
    }`;

    // Bounce via Altinn 2 so its legacy cookies stay in sync (matches AM UI).
    let finalLocation = redirectTarget;
    if (auth.config.routeChangeReporteeViaAltinn2) {
      const bounce = new URL(
        `${auth.config.endpoints.hostBaseUrl}ui/Reportee/ChangeReporteeAndRedirect`,
      );
      bounce.searchParams.set("P", party.partyUuid);
      bounce.searchParams.set("goTo", redirectTarget);
      finalLocation = bounce.toString();
    }

    const headers = new Headers();
    headers.append("Location", finalLocation);
    headers.append("Cache-Control", "no-store");

    // Validate the external-JSON values before writing them into Set-Cookie.
    if (isValidUuid(party.partyUuid)) {
      headers.append(
        "Set-Cookie",
        `AltinnPartyUuid=${party.partyUuid}; ${attributes}`,
      );
    }
    if (typeof party.partyId === "number" && Number.isFinite(party.partyId)) {
      headers.append(
        "Set-Cookie",
        `AltinnPartyId=${party.partyId}; ${attributes}`,
      );
    }

    return new Response(null, { status: 302, headers });
  } catch {
    return Response.redirect(redirectTarget, 302);
  }
};
