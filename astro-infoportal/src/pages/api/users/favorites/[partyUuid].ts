import type { APIRoute } from "astro";
import {
  altinnPlatformFetch,
  getAuthContext,
  isValidUuid,
  jsonResponse,
} from "../../../../api/altinn/client";
import { getProfileApiBaseUrl } from "../../../../api/altinn/config";

export const prerender = false;

async function forward(
  request: Request,
  partyUuid: string | undefined,
  method: "PUT" | "DELETE",
) {
  const auth = getAuthContext(request);

  if (!auth.isAuthenticated) {
    return jsonResponse(
      { error: "User must be authenticated to modify favorites" },
      400,
    );
  }

  if (!partyUuid || !isValidUuid(partyUuid)) {
    return jsonResponse({ error: "Invalid party UUID" }, 400);
  }

  try {
    const response = await altinnPlatformFetch(
      auth,
      `${getProfileApiBaseUrl(auth.config)}/users/current/party-groups/favorites/${partyUuid}`,
      { method },
    );

    if (!response || !response.ok) {
      return jsonResponse(
        {
          error: `Failed to ${method === "PUT" ? "add" : "remove"} favorite party`,
        },
        500,
      );
    }

    return new Response(null, { status: 204 });
  } catch {
    return jsonResponse(
      {
        error: `Failed to ${method === "PUT" ? "add" : "remove"} favorite party`,
      },
      500,
    );
  }
}

export const PUT: APIRoute = ({ request, params }) =>
  forward(request, params.partyUuid, "PUT");

export const DELETE: APIRoute = ({ request, params }) =>
  forward(request, params.partyUuid, "DELETE");
