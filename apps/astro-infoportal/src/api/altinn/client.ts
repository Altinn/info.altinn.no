import type { AltinnPlatformConfig } from "./config";
import { getAltinnPlatformConfig } from "./config";

export interface AuthContext {
  isAuthenticated: boolean;
  token: string | null;
  partyUuid: string | null;
  config: AltinnPlatformConfig;
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.split("=");
    const name = rawName?.trim();
    if (!name) continue;
    result[name] = decodeURIComponent(rawValue.join("=").trim());
  }
  return result;
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + padding);
}

function isJwtValid(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (typeof payload?.exp !== "number") return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function getRequestHostname(request: Request): string | null {
  const hostHeader = request.headers.get("host");
  if (hostHeader) return hostHeader.split(":")[0];
  try {
    return new URL(request.url).hostname;
  } catch {
    return null;
  }
}

export function getAuthContext(request: Request): AuthContext {
  const config = getAltinnPlatformConfig(getRequestHostname(request));
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies[config.jwtCookieName] ?? null;
  const partyUuid = cookies[config.partyUuidCookieName] ?? null;
  const isAuthenticated = !!token && isJwtValid(token);
  return {
    isAuthenticated,
    token: isAuthenticated ? token : null,
    partyUuid,
    config,
  };
}

export interface PlatformFetchOptions {
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
}

export async function altinnPlatformFetch(
  auth: AuthContext,
  url: string,
  options: PlatformFetchOptions = {},
): Promise<Response | null> {
  if (!auth.isAuthenticated || !auth.token) return null;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.token}`,
    ...(options.headers ?? {}),
  };

  if (auth.config.subscriptionKey) {
    headers[auth.config.subscriptionKeyHeaderName] =
      auth.config.subscriptionKey;
  }

  return fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ?? null,
  });
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export function emptyFavoritesGroup() {
  return {
    name: "Favorites",
    isFavorite: true,
    parties: [] as string[],
  };
}
