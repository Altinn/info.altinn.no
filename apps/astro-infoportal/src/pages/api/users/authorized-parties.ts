import type { APIRoute } from "astro";
import {
  altinnPlatformFetch,
  getAuthContext,
  jsonResponse,
} from "../../../api/altinn/client";
import { getAccessManagementApiBaseUrl } from "../../../api/altinn/config";
import type { AuthorizedParty } from "../../../api/altinn/types";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = getAuthContext(request);

  if (!auth.isAuthenticated) {
    return jsonResponse([] as AuthorizedParty[]);
  }

  try {
    const response = await altinnPlatformFetch(
      auth,
      `${getAccessManagementApiBaseUrl(auth.config)}/authorizedparties?includeAltinn2=true`,
    );

    if (!response || !response.ok) {
      return jsonResponse(
        { error: "Failed to retrieve authorized parties" },
        500,
      );
    }

    const parties = (await response.json()) as AuthorizedParty[] | null;
    return jsonResponse(parties ?? []);
  } catch {
    return jsonResponse(
      { error: "Failed to retrieve authorized parties" },
      500,
    );
  }
};
