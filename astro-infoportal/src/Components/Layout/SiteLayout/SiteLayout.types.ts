import type { Locale } from "@i18n/index";

export interface SiteLayoutProps {
  headerViewModel?: any;
  footerViewModel?: any;
  pageSidebarViewModel?: any;
  child?: { componentName: string; [key: string]: any };
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
