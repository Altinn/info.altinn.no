import {
  detectLocaleFromPath,
  navigateToLocale,
  resolveLocale,
} from "@constants/languages";
import type { Locale } from "@i18n/index";
import { useEffect } from "react";
import { isBrowser } from "../utils/browserUtils";
import { fetchCurrentUserOnce } from "./useCurrentUser";

type LocaleMenuEntry = { locale: Locale; pageUrl: string };

// Auto-select locale from the profile. Client-side only: the page is edge-cached
// per URL, so SSR must never vary by this.
export function useLanguagePreference(
  menuLanguageList: LocaleMenuEntry[] | undefined,
): void {
  useEffect(() => {
    if (!isBrowser) return;

    fetchCurrentUserOnce().then((user) => {
      if (!user?.language) return;
      const preferred = resolveLocale(user.language);
      const current = detectLocaleFromPath(window.location.pathname);
      if (preferred === current) return;
      navigateToLocale(preferred, menuLanguageList, window.location.pathname);
    });
  }, [menuLanguageList]);
}
