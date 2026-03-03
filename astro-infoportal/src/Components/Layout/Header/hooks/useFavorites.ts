/**
 * Hook for managing favorite parties with API synchronization
 */

import { useCallback, useEffect, useState } from "react";
import { isBrowser } from "../utils/browserUtils";

const STORAGE_KEY = "altinn-favorite-parties";

/**
 * Loads favorites from localStorage as fallback
 */
const loadFromLocalStorage = (): string[] => {
  if (!isBrowser) return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Saves favorites to localStorage as backup
 */
const saveToLocalStorage = (favorites: string[]): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * Hook for managing user's favorite parties
 * Syncs with backend API and uses localStorage as fallback
 */
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>(loadFromLocalStorage);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load favorites from API on mount
  useEffect(() => {
    if (!isBrowser) {
      setIsLoading(false);
      return;
    }

    const loadFavorites = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/users/favorites");

        if (response.ok) {
          const profileGroup = await response.json();
          const favoritePartyIds = profileGroup?.parties || [];
          setFavorites(favoritePartyIds);
          saveToLocalStorage(favoritePartyIds);
          setError(null);
        } else {
          console.warn("Failed to load favorites from API, using localStorage");
          // Keep localStorage values already loaded in state
        }
      } catch (err) {
        console.error("Error loading favorites:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load favorites",
        );
        // Keep localStorage values already loaded in state
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Toggle favorite with API call and optimistic update
  const toggleFavorite = useCallback(
    async (partyUuid: string) => {
      if (!isBrowser) return;

      const isFavorite = favorites.includes(partyUuid);
      const newFavorites = isFavorite
        ? favorites.filter((id) => id !== partyUuid)
        : [...favorites, partyUuid];

      // Optimistic update
      setFavorites(newFavorites);
      saveToLocalStorage(newFavorites);

      try {
        const method = isFavorite ? "DELETE" : "PUT";
        const response = await fetch(`/api/users/favorites/${partyUuid}`, {
          method,
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to update favorite: ${response.status}`);
        }

        setError(null);
      } catch (err) {
        console.error("Error toggling favorite:", err);
        setError(
          err instanceof Error ? err.message : "Failed to update favorite",
        );

        // Revert optimistic update on error
        setFavorites(favorites);
        saveToLocalStorage(favorites);
      }
    },
    [favorites],
  );

  // Add favorite
  const addFavorite = useCallback(
    async (partyUuid: string) => {
      if (!isBrowser || favorites.includes(partyUuid)) return;

      const newFavorites = [...favorites, partyUuid];

      // Optimistic update
      setFavorites(newFavorites);
      saveToLocalStorage(newFavorites);

      try {
        const response = await fetch(`/api/users/favorites/${partyUuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to add favorite: ${response.status}`);
        }

        setError(null);
      } catch (err) {
        console.error("Error adding favorite:", err);
        setError(err instanceof Error ? err.message : "Failed to add favorite");

        // Revert optimistic update on error
        setFavorites(favorites);
        saveToLocalStorage(favorites);
      }
    },
    [favorites],
  );

  // Remove favorite
  const removeFavorite = useCallback(
    async (partyUuid: string) => {
      if (!isBrowser || !favorites.includes(partyUuid)) return;

      const newFavorites = favorites.filter((id) => id !== partyUuid);

      // Optimistic update
      setFavorites(newFavorites);
      saveToLocalStorage(newFavorites);

      try {
        const response = await fetch(`/api/users/favorites/${partyUuid}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to remove favorite: ${response.status}`);
        }

        setError(null);
      } catch (err) {
        console.error("Error removing favorite:", err);
        setError(
          err instanceof Error ? err.message : "Failed to remove favorite",
        );

        // Revert optimistic update on error
        setFavorites(favorites);
        saveToLocalStorage(favorites);
      }
    },
    [favorites],
  );

  return {
    favorites,
    isLoading,
    error,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };
};
