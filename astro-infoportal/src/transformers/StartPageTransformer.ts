import type { IJSONTransformer } from "./IJSONTransformer";

export class StartPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const bodyData = {
      componentName: "StartPage",
      pageName: cmsPageData.name,
      isUserLoggedIn: false,
      userName: cmsPageData.properties.userName || null,
      welcomeMessageTitle: cmsPageData.properties.welcomeMessageTitle || null,
      welcomeMessageIngress: cmsPageData.properties.welcomeMessageIngress || null,
      searchPageUrl: cmsPageData.properties.searchPageUrl || "/sok/",
      searchPlaceholder: cmsPageData.properties.searchPlaceholder || "Søk",
      searchAriaLabel: cmsPageData.properties.searchAriaLabel || "Søk",
      searchContentText: cmsPageData.properties.searchContentText || null,
      login: cmsPageData.properties.login || null,
      alternateLogin: cmsPageData.properties.alternateLogin || null,
      criticalOperationalMessages: cmsPageData.properties.criticalOperationalMessages || [],
      operationalMessages: cmsPageData.properties.operationalMessages || [],
      relevantSchemas: cmsPageData.properties.relevantSchemas || null,
      companyTitle: cmsPageData.properties.companyTitle || null,
      companyText: cmsPageData.properties.companyText || null,
      companyImageUrl: cmsPageData.properties.companyImageUrl || null,
      companyImageAlt: cmsPageData.properties.companyImageAlt || null,
      promoBoxArea: cmsPageData.properties.promoBoxArea || null,
      linkButtonAreaTitle: cmsPageData.properties.linkButtonAreaTitle || null,
      linkButtonArea: cmsPageData.properties.linkButtonArea || null,
      topImageUrl: cmsPageData.properties.topImageUrl || null,
      latestNewsHeading: cmsPageData.properties.latestNewsHeading || "Siste nyheter",
      newsList: cmsPageData.properties.newsList || [],
      newsArchiveUrl: cmsPageData.properties.newsArchiveUrl || "/nyheter/",
      showArchiveText: cmsPageData.properties.showArchiveText || "Se arkiv",
      campaginArea: cmsPageData.properties.campaginArea || null,
    };

    return bodyData;
  }
}
