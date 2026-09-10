import {
  CookieBanner,
  DsAlert,
  Layout,
  RootProvider,
  SkyraSurvey,
  useConsent,
} from "@altinn/altinn-components";
import { useEffect, useRef, useState } from "react";
import * as Components from "../../../App.Components";
import "@altinn/altinn-components/dist/global.css";
import "@digdir/designsystemet-theme";
import "@digdir/designsystemet-css";
import {
  CONSENT_REOPEN_HASH,
  deleteLegacyConsentCookie,
  loadSiteimprove,
} from "@utils/consent";
import useSidebarConfig from "../../Shared/PageSidebar/useSidebarConfig";
import useFooterConfig from "../Footer/useFooterConfig";
import { useLanguagePreference } from "../Header/hooks/useLanguagePreference";
import useHeaderConfig from "../Header/useHeaderConfig";
import type { SiteLayoutProps } from "./SiteLayout.types";
import { useBannerHeight } from "./useBannerHeight";
import { useHashScroll } from "./useHashScroll";
import "./SiteLayout.scss";
import { SkipLink } from "@digdir/designsystemet-react";
import BannerBlock from "../../../Components/Blocks/BannerBlock/BannerBlock";

const SiteLayout = ({
  child,
  headerViewModel,
  footerViewModel,
  pageSidebarViewModel,
  skipLinkText,
  consentBanner,
  missingTranslationText,
}: SiteLayoutProps) => {
  const Comp = child ? (Components as any)[child.componentName] : null;

  // Scroll to a #section target on cold loads once layout has settled.
  useHashScroll();

  // Issue #576: keep --altinn-banner-height in sync so the actor-selector drawer
  // offsets below the banner instead of hiding the global-menu row.
  useBannerHeight();

  const { consent, isAnswered, acceptAll, rejectAll, clear } = useConsent();
  const [hydrated, setHydrated] = useState(false);
  // Set by open() so the focus effect only fires on an explicit reopen
  // (footer / personvern / programmatic), not when the banner first appears.
  const focusOnOpenRef = useRef(false);

  const currentLanguage = headerViewModel?.menuLanguageList?.find(
    (l: any) => l.selected,
  )?.languageName;

  const normalize = (s?: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const getLanguageCode = (langName?: string): "nb" | "nn" | "en" => {
    const v = normalize(langName);
    if (!v) return "nb";
    if (
      v === "nn" ||
      v === "nnno" ||
      v.startsWith("nn-") ||
      v.includes("nynorsk")
    )
      return "nn";
    if (v === "en" || v.startsWith("en-") || v.includes("english")) return "en";
    if (
      v === "no" ||
      v === "nonb" ||
      v.startsWith("no-") ||
      v.includes("norsk") ||
      v.includes("bokmal")
    )
      return "nb";
    return "nb";
  };

  const languageCode = getLanguageCode(currentLanguage);

  const openCookieBanner = () => {
    clear();
    focusOnOpenRef.current = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash === `#${CONSENT_REOPEN_HASH}`) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  };

  // Config from hooks
  const { headerProps, color } = useHeaderConfig(
    headerViewModel || ({} as any),
    languageCode,
  );

  // Client-side locale auto-select from the profile (never SSR — cached per URL).
  useLanguagePreference(headerViewModel?.menuLanguageList);
  const footerProps = useFooterConfig(
    footerViewModel || ({} as any),
    consentBanner ? openCookieBanner : undefined,
  );
  const sidebarConfig = useSidebarConfig(pageSidebarViewModel);

  // Pages that have their own width constraints and should not be constrained by layout
  const exludedPages = [
    "StartPage",
    "SchemaOverviewPage",
    "SectionPage",
    "ThemePage",
    "SubsidyOverviewPage",
    "ProviderPage",
  ];
  const shouldConstrainWidth =
    child && !exludedPages.includes(child.componentName);
  const hasSidebar = !!sidebarConfig;

  const contentColor: "company" = "company";
  const shouldShowCookieBanner = hydrated && !!consentBanner && !isAnswered;

  // Client-only: the page is edge-cached per URL, so visibility must never be
  // decided at SSR. Show only when a (re)decision is needed.
  useEffect(() => {
    deleteLegacyConsentCookie();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (consent.statistics) loadSiteimprove();
  }, [consent.statistics]);

  // Reopen on direct hash visits. Footer clicks are wired through FooterLink's
  // own onClick support from altinn-components.
  useEffect(() => {
    if (window.location.hash === `#${CONSENT_REOPEN_HASH}`) openCookieBanner();
  }, []);

  // After an explicit reopen, move focus to the banner so keyboard and
  // screen-reader users land on it (announced via aria-labelledby).
  useEffect(() => {
    if (shouldShowCookieBanner && focusOnOpenRef.current) {
      focusOnOpenRef.current = false;
      const banner = document.querySelector<HTMLElement>(".consent-banner");
      banner?.setAttribute("tabindex", "-1");
      banner?.focus();
    }
  }, [shouldShowCookieBanner]);

  const acceptCookieConsent = () => {
    acceptAll();
  };
  const rejectCookieConsent = () => {
    rejectAll();
  };

  return (
    <RootProvider languageCode={languageCode}>
      <SkipLink className="site-layout__skip-link" href="#main-content">
        {skipLinkText}
      </SkipLink>
      {shouldShowCookieBanner && (
        <CookieBanner
          className="consent-banner"
          onAccept={acceptCookieConsent}
          onReject={rejectCookieConsent}
        />
      )}
      {/* Headless: loads the SRI-pinned Skyra SDK and follows the statistics
          consent decision. Renders nothing, so SSR output is unchanged and
          the edge-cached HTML stays identical for every visitor. */}
      <SkyraSurvey consent={consent.statistics} />
      {headerViewModel?.banner && <BannerBlock {...headerViewModel.banner} />}
      <Layout
        color={color}
        header={headerViewModel ? headerProps : undefined}
        footer={footerProps}
        content={{ color: contentColor }}
        {...(sidebarConfig ? { sidebar: sidebarConfig } : {})}
        theme="default"
      >
        {missingTranslationText && (
          <div
            className={`layout-content-constrained${
              hasSidebar ? " layout-content-constrained--sidebar" : ""
            } site-layout__missing-translation`}
          >
            {/* DsAlert, not the altinn-components Alert: that one always renders
                a heading element, and an empty heading both trips the
                :empty safety net below and swallows the info icon, which
                .ds-alert hangs off the first-child heading. Headingless is the
                shape Designsystemet documents for a one-line notice. */}
            <DsAlert data-color="info">{missingTranslationText}</DsAlert>
          </div>
        )}
        {shouldConstrainWidth ? (
          <div
            className={`layout-content-constrained${
              hasSidebar ? " layout-content-constrained--sidebar" : ""
            }`}
          >
            <Comp {...child} />
          </div>
        ) : (
          child && (
            <div>
              <Comp {...child} />
            </div>
          )
        )}
      </Layout>
    </RootProvider>
  );
};

export default SiteLayout;
