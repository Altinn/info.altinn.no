import type { IJSONTransformer } from "./IJSONTransformer";

export class SectionPageTransformer implements IJSONTransformer {
  public Transform(cmsPageData: any): any {
    const bodyData = {
      componentName: "SectionPage",
      pageName: cmsPageData.name,
      backgroundImage: {
        src: "/assets/img/illustrasjon_starte_og_drive.svg",
        componentName: "Image",
      },
      searchForm: {
        searchLabel: "Søk i innhold",
        searchPageUrl: "/sok/",
        componentName: "SearchForm",
      },
      goToLinkText: "Veiledere innen ulike tema og bransjer",
      goToLinkLocation: {
        text: "Veiledere innen ulike tema og bransjer",
        url: "/starte-og-drive/starte/guider/",
        componentName: "LinkItem",
      },
      themePageLinks: {},
    };

    const themePageLinks = [];

    for (const item of cmsPageData.properties.themePageArea) {
      themePageLinks.push({ text: item.name, url: item.route.path });
    }

    bodyData.themePageLinks = themePageLinks;
    return bodyData;
  }
}
