import type { APIRoute } from "astro";
import {
  altinnPlatformFetch,
  emptyFavoritesGroup,
  getAuthContext,
  jsonResponse,
} from "../../../api/altinn/client";
import { getProfileApiBaseUrl } from "../../../api/altinn/config";
import type { ProfileGroup } from "../../../api/altinn/types";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = getAuthContext(request);

  if (!auth.isAuthenticated) {
    return jsonResponse(emptyFavoritesGroup());
  }

  try {
    const response = await altinnPlatformFetch(
      auth,
      `${getProfileApiBaseUrl(auth.config)}/users/current/party-groups/favorites`,
    );

    if (!response || !response.ok) {
      return jsonResponse(emptyFavoritesGroup());
    }

    const group = (await response.json()) as ProfileGroup | null;
    return jsonResponse(group ?? emptyFavoritesGroup());
  } catch {
    return jsonResponse({ error: "Failed to retrieve favorite parties" }, 500);
  }
};
