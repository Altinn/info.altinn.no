import { useEffect, useState } from "react";
import { isBrowser } from "../utils/browserUtils";

export interface CurrentUser {
  selfAccountUuid?: string | null;
  currentAccountUuid?: string | null;
  showDeletedEntities?: boolean | null;
  language?: string | null;
}

// Shared cache: header + language hook reuse one /api/users/current request.
let currentUserPromise: Promise<CurrentUser> | null = null;

export function fetchCurrentUserOnce(): Promise<CurrentUser> {
  if (!currentUserPromise) {
    currentUserPromise = fetch("/api/users/current", {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) =>
        response.ok ? (response.json() as Promise<CurrentUser>) : {},
      )
      .catch(() => ({}) as CurrentUser);
  }
  return currentUserPromise;
}

export function useCurrentUser(): {
  user: CurrentUser | null;
  isLoading: boolean;
} {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(isBrowser);

  useEffect(() => {
    if (!isBrowser) {
      setIsLoading(false);
      return;
    }
    let active = true;
    fetchCurrentUserOnce().then((value) => {
      if (active) {
        setUser(value);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { user, isLoading };
}
