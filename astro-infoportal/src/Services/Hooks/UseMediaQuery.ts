import { useEffect, useState } from "react";

/**
 * SSR-safe media query hook that matches CSS breakpoints.
 * Uses matchMedia API for efficient breakpoint detection.
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    // SSR-safe: return false during server-side rendering
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Update state on mount (in case SSR default was wrong)
    setMatches(mediaQuery.matches);

    // Listen for breakpoint changes (more efficient than resize events)
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

const DESKTOP_BREAKPOINT = 1024;

/**
 * Convenience hook for desktop breakpoint (1024px).
 * Returns true when viewport is >= 1024px.
 * SSR-safe - defaults to false (mobile-first).
 */
export const useIsDesktop = (): boolean => {
  return useMediaQuery(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
};
