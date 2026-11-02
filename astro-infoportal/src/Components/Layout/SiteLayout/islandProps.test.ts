import { describe, expect, it } from "vitest";
import { toSiteLayoutIslandProps } from "./islandProps";

describe("toSiteLayoutIslandProps", () => {
  it("drops server-only data and fields the client never reads", () => {
    const props = toSiteLayoutIslandProps({
      child: { componentName: "SchemaPage" },
      componentName: "SiteLayout",
      consentBanner: null,
      pageSidebarViewModel: { mainItems: [] },
      skipLinkText: "Hopp til hovedinnhold",
      locale: "nb",
      headerViewModel: {
        menuText: "Meny",
        hostBaseUrl: "https://altinn.no",
        isPreview: false,
        menuLanguageList: [
          {
            locale: "nb",
            pageUrl: "/",
            languageName: "Norsk",
            selected: true,
            languageTeaser: "Alt innhold er tilgjengelig på bokmål.",
            languageImage: "/Static/img/no.svg",
          },
        ],
        banner: { isActive: true },
      },
      footerViewModel: { address1: "Postboks", searchUrlBody: "/sok" },
    });

    expect(props).toEqual({
      skipLinkText: "Hopp til hovedinnhold",
      locale: "nb",
      headerViewModel: {
        menuText: "Meny",
        menuLanguageList: [
          { locale: "nb", pageUrl: "/", languageName: "Norsk", selected: true },
        ],
        banner: { isActive: true },
      },
      footerViewModel: { address1: "Postboks" },
    });
  });

  it("keeps missing view models missing", () => {
    expect(toSiteLayoutIslandProps({ headerViewModel: null })).toEqual({
      headerViewModel: null,
    });
    expect(toSiteLayoutIslandProps({})).toEqual({});
  });
});
