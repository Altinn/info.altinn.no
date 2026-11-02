import { RootProvider } from "@altinn/altinn-components";
import type { Locale } from "@i18n/index";
import { renderToString } from "react-dom/server";
import * as Components from "../../../App.Components";
import { UiLanguageProvider } from "../UiLanguage/UiLanguage";
import { IslandServerContext } from "./Island";

interface PageContentProps {
  child: { componentName: string; [key: string]: any };
  locale?: Locale;
  contentLocale?: Locale;
}

/**
 * Server-only render of the page component (issue #778). AstroSiteLayout puts
 * it in SiteLayout's slot, so it ships as static HTML and its data is not
 * serialized into the SiteLayout island. Interactive parts hydrate on their
 * own through `withIsland`. Never import this from client code: it pulls in
 * react-dom/server.
 */
const PageContent = ({ child, locale, contentLocale }: PageContentProps) => {
  const Comp = (Components as any)[child.componentName];
  if (!Comp) {
    console.error(
      `Component "${child.componentName}" not found in Components registry`,
    );
    return null;
  }
  // Same rule as SiteLayout (issue #713): interface strings inside fallback
  // content carry the requested language.
  const uiLang =
    locale && contentLocale && locale !== contentLocale ? locale : undefined;

  return (
    <IslandServerContext.Provider value={{ locale, uiLang, renderToString }}>
      <RootProvider languageCode={locale}>
        <UiLanguageProvider lang={uiLang}>
          <Comp {...child} />
        </UiLanguageProvider>
      </RootProvider>
    </IslandServerContext.Provider>
  );
};

export default PageContent;
