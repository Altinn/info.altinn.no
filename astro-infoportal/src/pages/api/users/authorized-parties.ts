import type { APIRoute } from "astro";
import {
  type AuthContext,
  altinnPlatformFetch,
  getAuthContext,
  jsonResponse,
} from "../../../api/altinn/client";
import {
  getAccessManagementApiBaseUrl,
  getProfileApiBaseUrl,
} from "../../../api/altinn/config";
import type {
  AuthorizedParty,
  Connection,
  ConnectionEntity,
  ConnectionRoleInfo,
  PaginatedResult,
  UserProfile,
} from "../../../api/altinn/types";

export const prerender = false;

// Actor list (parties the user can represent). Default: authorizedparties (what AM
// ships); USE_NEW_ACTOR_LIST: enduser/connections. Both mapped to AuthorizedParty[].

function buildAuthorizedPartiesUrl(base: string): string {
  const url = new URL(`${base}/authorizedparties`);
  url.searchParams.set("includeAltinn2", "true");
  url.searchParams.set("includeRoles", "false");
  url.searchParams.set("includeAccessPackages", "false");
  url.searchParams.set("includeResources", "false");
  url.searchParams.set("includeInstances", "false");
  return url.toString();
}

async function fetchAuthorizedParties(
  auth: AuthContext,
): Promise<AuthorizedParty[]> {
  const response = await altinnPlatformFetch(
    auth,
    buildAuthorizedPartiesUrl(getAccessManagementApiBaseUrl(auth.config)),
  );
  if (!response || !response.ok) {
    throw new Error("authorizedparties request failed");
  }
  const parties = (await response.json()) as AuthorizedParty[] | null;
  return parties ?? [];
}

// PROVISIONAL (USE_NEW_ACTOR_LIST only): connections lacks
// onlyHierarchyElementWithNoAccess / authorizedResources — defaulted. Verify against
// AM's final mapping before enabling.
function entityToAuthorizedParty(
  entity: ConnectionEntity,
  roles: ConnectionRoleInfo[] = [],
): AuthorizedParty {
  const isPerson = entity.type === "Person";
  return {
    partyUuid: entity.id,
    name: entity.name,
    organizationNumber: isPerson
      ? null
      : (entity.organizationIdentifier ?? null),
    dateOfBirth: isPerson ? (entity.dateOfBirth ?? null) : null,
    partyId: entity.partyid ?? 0,
    type: isPerson ? "Person" : "Organization",
    unitType: entity.variant ?? null,
    isDeleted: entity.isDeleted,
    onlyHierarchyElementWithNoAccess: false,
    authorizedResources: [],
    authorizedRoles: roles
      .map((role) => role.code)
      .filter((code): code is string => !!code),
    subunits: (entity.children ?? []).map((child) =>
      entityToAuthorizedParty(child),
    ),
  };
}

// The user's OWN party uuid (not the active-reportee cookie) — keys the actor list,
// mirroring AM's GetUserPartyUuid.
async function resolveUserPartyUuid(auth: AuthContext): Promise<string | null> {
  const response = await altinnPlatformFetch(
    auth,
    `${getProfileApiBaseUrl(auth.config)}/users/current`,
  );
  if (!response || !response.ok) return null;
  const profile = (await response.json()) as UserProfile | null;
  return profile?.party?.partyUuid ?? null;
}

async function fetchNewActorList(
  auth: AuthContext,
): Promise<AuthorizedParty[]> {
  const userPartyUuid = await resolveUserPartyUuid(auth);
  if (!userPartyUuid) return [];
  const url = new URL(
    `${getAccessManagementApiBaseUrl(auth.config)}/enduser/connections`,
  );
  url.searchParams.set("party", userPartyUuid);
  url.searchParams.set("from", "");
  url.searchParams.set("to", userPartyUuid);
  url.searchParams.set("includeClientDelegations", "true");
  url.searchParams.set("includeAgentConnections", "true");

  const response = await altinnPlatformFetch(auth, url.toString());
  if (!response || !response.ok) {
    throw new Error("connections request failed");
  }
  // Spec wraps the array in `data` (ConnectionDtoPaginatedResult).
  const parsed = (await response.json()) as PaginatedResult<Connection> | null;
  const list = parsed?.data ?? [];
  return list.map((connection) =>
    entityToAuthorizedParty(connection.party, connection.roles),
  );
}

export const GET: APIRoute = async ({ request }) => {
  const auth = getAuthContext(request);

  if (!auth.isAuthenticated) {
    return jsonResponse([] as AuthorizedParty[]);
  }

  try {
    const parties = auth.config.useNewActorList
      ? await fetchNewActorList(auth)
      : await fetchAuthorizedParties(auth);
    return jsonResponse(parties);
  } catch {
    return jsonResponse(
      { error: "Failed to retrieve authorized parties" },
      500,
    );
  }
};
