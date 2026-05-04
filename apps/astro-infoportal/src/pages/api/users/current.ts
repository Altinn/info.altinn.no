import type { APIRoute } from "astro";
import {
  altinnPlatformFetch,
  getAuthContext,
  jsonResponse,
} from "../../../api/altinn/client";
import { getProfileApiBaseUrl } from "../../../api/altinn/config";
import type {
  CurrentUserResponse,
  UserProfile,
} from "../../../api/altinn/types";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = getAuthContext(request);

  if (!auth.isAuthenticated) {
    const body: CurrentUserResponse = {
      selfAccountUuid: null,
      currentAccountUuid: null,
    };
    return jsonResponse(body);
  }

  try {
    const response = await altinnPlatformFetch(
      auth,
      `${getProfileApiBaseUrl(auth.config)}/users/current`,
    );

    if (!response || !response.ok) {
      return jsonResponse({ error: "Failed to retrieve user profile" }, 500);
    }

    const profile = (await response.json()) as UserProfile | null;

    const body: CurrentUserResponse = {
      selfAccountUuid: profile?.party?.partyUuid ?? null,
      currentAccountUuid: auth.partyUuid,
      showDeletedEntities:
        profile?.profileSettingPreference?.shouldShowDeletedEntities ?? null,
    };
    return jsonResponse(body);
  } catch {
    return jsonResponse({ error: "Failed to retrieve user profile" }, 500);
  }
};
