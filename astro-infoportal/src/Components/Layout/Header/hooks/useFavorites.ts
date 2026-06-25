/**
 * Hook for managing favorite parties with API synchronization
 */

import { useCallback, useEffect, useState } from "react";
import { isBrowser } from "../utils/browserUtils";


/**
 * Hook for managing user's favorite parties
 * Syncs with backend API
 */
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>();
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
          setError(null);
        } else {
          console.warn("Failed to load favorites from API");
        }
      } catch (err) {
        console.error("Error loading favorites:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load favorites",
        );
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
        ? favorites.filter((id: any) => id !== partyUuid)
        : [...favorites, partyUuid];

      // Optimistic update
      setFavorites(newFavorites);

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
      }
    },
    [favorites],
  );

  // Remove favorite
  const removeFavorite = useCallback(
    async (partyUuid: string) => {
      if (!isBrowser || !favorites.includes(partyUuid)) return;

      const newFavorites = favorites.filter((id: any) => id !== partyUuid);

      // Optimistic update
      setFavorites(newFavorites);

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
