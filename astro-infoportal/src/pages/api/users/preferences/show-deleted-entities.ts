import type { APIRoute } from "astro";
import {
  altinnPlatformFetch,
  getAuthContext,
  jsonResponse,
} from "../../../../api/altinn/client";
import { getProfileApiBaseUrl } from "../../../../api/altinn/config";
import type { ProfileSettingPreference } from "../../../../api/altinn/types";

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
  const auth = getAuthContext(request);

  if (!auth.isAuthenticated) {
    return jsonResponse(
      { error: "User must be authenticated to update preferences" },
      400,
    );
  }

  let shouldShowDeletedEntities: boolean;
  try {
    const body = await request.json();
    if (typeof body !== "boolean") {
      return jsonResponse({ error: "Request body must be a boolean" }, 400);
    }
    shouldShowDeletedEntities = body;
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  try {
    const response = await altinnPlatformFetch(
      auth,
      `${getProfileApiBaseUrl(auth.config)}/users/current/profilesettings`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shouldShowDeletedEntities }),
      },
    );

    if (!response || !response.ok) {
      return jsonResponse({ error: "Failed to update preference" }, 500);
    }

    const updated = (await response.json()) as ProfileSettingPreference | null;
    return jsonResponse({
      shouldShowDeletedEntities:
        updated?.shouldShowDeletedEntities ?? shouldShowDeletedEntities,
    });
  } catch {
    return jsonResponse({ error: "Failed to update preference" }, 500);
  }
};
