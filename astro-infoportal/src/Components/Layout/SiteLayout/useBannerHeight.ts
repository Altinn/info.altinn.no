import { useEffect } from "react";
import { sumOffsetHeights } from "./bannerHeight";

// The infoportal banners stacked above the altinn-components <Layout>. Matched
// by class (never wrapped) so BannerBlock.scss's `:has(~ * [data-current-id])`
// sibling rule keeps working.
const BANNER_SELECTORS = [
  ".consent-banner",
  ".banner-block-strong",
  ".banner-block",
] as const;

/**
 * Issue #576. The altinn-components <Layout> positions the actor-selector drawer
 * and its backdrop at `top: calc(4.5rem + var(--altinn-banner-height))`,
 * defaulting the variable to 0 on the layout base. The infoportal renders its
 * banners *above* <Layout> (not through the library's banner slot), so the
 * variable is never set and the drawer/backdrop cover the banner-displaced
 * global-menu row.
 *
 * This hook measures the visible banner stack and publishes its height as
 * `--infoportal-banner-height` on <html>. A rule in SiteLayout.scss maps that
 * onto `--altinn-banner-height` on the layout base, so the drawer offsets below
 * the banner and the menu row stays visible. A hidden banner reports
 * offsetHeight 0, so the value shrinks to match (keeping it consistent with the
 * mobile drawer-open hide rule).
 */
export function useBannerHeight(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    const measure = () => {
      const elements = BANNER_SELECTORS.map((sel) =>
        document.querySelector<HTMLElement>(sel),
      );
      root.style.setProperty(
        "--infoportal-banner-height",
        `${sumOffsetHeights(elements)}px`,
      );
    };

    // Coalesce bursts of observer callbacks into a single layout read.
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    // Size changes of any present banner: content reflow, viewport media-query
    // changes, and display:none toggling (offsetHeight → 0).
    const resizeObserver = new ResizeObserver(update);
    const observeBanners = () => {
      resizeObserver.disconnect();
      for (const sel of BANNER_SELECTORS) {
        const el = document.querySelector(sel);
        if (el) resizeObserver.observe(el);
      }
    };

    // Banners are decided client-side (consent / dismissal), so they mount and
    // unmount after hydration. Re-bind the size observer and re-measure.
    const mutationObserver = new MutationObserver(() => {
      observeBanners();
      update();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    observeBanners();
    measure();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      root.style.removeProperty("--infoportal-banner-height");
    };
  }, []);
}
