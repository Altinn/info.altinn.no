import { isLocale, LOCALE_TO_PERSISTENT_CONTEXT } from "@constants/languages";
import type { APIRoute } from "astro";
import {
  altinnPlatformFetch,
  getAuthContext,
  jsonResponse,
} from "../../../../api/altinn/client";
import { getProfileApiBaseUrl } from "../../../../api/altinn/config";

export const prerender = false;

// Persist language: PATCH the profile (mirrors AM's SettingsController, calling the platform directly).
export const POST: APIRoute = async ({ request }) => {
  const auth = getAuthContext(request);
  if (!auth.isAuthenticated) {
    return jsonResponse({ error: "User must be authenticated" }, 400);
  }

  // CSRF: this mutates context via the auth cookie — reject cross-site callers.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
    return jsonResponse({ error: "Cross-site request rejected" }, 403);
  }

  let languageCode: unknown;
  try {
    languageCode = (await request.json())?.languageCode;
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  // Derive cookie + PATCH values from the map, never raw input (injection guard).
  if (!isLocale(languageCode)) {
    return jsonResponse({ error: "Unsupported language" }, 400);
  }
  const locale = languageCode;

  try {
    const response = await altinnPlatformFetch(
      auth,
      `${getProfileApiBaseUrl(auth.config)}/users/current/profilesettings`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: locale }),
      },
    );

    if (!response || !response.ok) {
      return jsonResponse({ error: "Failed to update language" }, 500);
    }

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Cache-Control", "no-store");

    return new Response(JSON.stringify({ language: locale }), {
      status: 200,
      headers,
    });
  } catch {
    return jsonResponse({ error: "Failed to update language" }, 500);
  }
};
