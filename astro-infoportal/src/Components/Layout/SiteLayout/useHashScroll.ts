import { useEffect } from "react";

/**
 * On a cold/first load of a `…/#section` URL, the browser's native fragment
 * scroll fires before the React tree (rendered via `client:load`) has hydrated
 * and the layout has settled (web-font + content reflow). It lands at the top
 * and never retries — so the section isn't reached, even though the heading id
 * is present in the server-rendered HTML. (Warm/cached loads happen to be fast
 * enough to land correctly, which is why "the second paste works".)
 *
 * This hook re-scrolls to the hash target once the page is ready — instantly,
 * and only on the initial load. It bails out the moment the user starts
 * scrolling, so it never fights them.
 */
export function useHashScroll(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawHash = window.location.hash;
    if (rawHash.length < 2) return;

    // Decode so percent-encoded ids (e.g. "#informasjons-og-p%C3%A5seplikt")
    // match the heading's id ("informasjons-og-påseplikt").
    const id = decodeURIComponent(rawHash.slice(1));
    let active = true;

    const scrollToTarget = () => {
      if (!active) return;
      document
        .getElementById(id)
        ?.scrollIntoView({ block: "start", behavior: "instant" });
    };

    // Stop auto-scrolling the instant the user takes control.
    const stop = () => {
      active = false;
    };
    const userEvents = [
      "wheel",
      "touchstart",
      "keydown",
      "pointerdown",
    ] as const;
    for (const evt of userEvents) {
      window.addEventListener(evt, stop, { passive: true });
    }

    // Re-scroll on the discrete "layout probably changed" milestones.
    const onLoad = () => scrollToTarget();
    window.addEventListener("load", onLoad);
    document.fonts?.ready.then(scrollToTarget).catch(() => {});

    // Bounded retry to absorb hydration/layout shift right after mount.
    const startedAt = performance.now();
    let rafId = 0;
    let timerId = 0;
    const tick = () => {
      if (!active) return;
      scrollToTarget();
      if (performance.now() - startedAt < 1200) {
        timerId = window.setTimeout(() => {
          rafId = requestAnimationFrame(tick);
        }, 150);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      active = false;
      window.removeEventListener("load", onLoad);
      for (const evt of userEvents) {
        window.removeEventListener(evt, stop);
      }
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, []);
}
