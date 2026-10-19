import type { Locale } from "@i18n/index";
import type { ReactNode } from "react";

export interface SiteLayoutProps {
  headerViewModel?: any;
  footerViewModel?: any;
  sidebar?: ReactNode;
  /** Astro always passes the named slot, even when it renders nothing. */
  hasSidebar?: boolean;
  children?: ReactNode;
  pageComponentName?: string;
  skipLinkText?: string;
  /** Set only when the page fell back to NB content (see buildMissingTranslationText). */
  missingTranslationText?: string | null;
  locale?: Locale;
  /**
   * The language the page content is actually in. Differs from `locale` only
   * when the requested language has no variant and Umbraco served bokmål
   * instead — the case issue #713's language tagging exists for.
   */
  contentLocale?: Locale;
}
