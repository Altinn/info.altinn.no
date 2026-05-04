import type { IJSONTransformer } from "../IJSONTransformer";

export class StartPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    /* C# logic (TS-ish++):
    const httpcontext: httpContextAccessor.HttpContext;
                const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                const isuserLoggedIn: httpContext?.Request.IsUserLoggedIn() ?? false;
                const username: httpContext?.Request.GetUserNameIfLoggedIn();
    
                const criticalmessages: [];
                const regularmessages: [];
    
                if (currentPage.AlertArea?.Items != null)
                {
                    for (const item of currentPage.AlertArea.Items)
                    {
                        if (contentLoader.TryGet<OperationalMessageArticlePage>(item.ContentLink, out const message))
                        {
                            const messageviewModel: operationalMessageArticlePageViewModelBuilder.Build(message, withOnPageEdit);
    
                            if (messageViewModel.colorVariant: = "danger")
                            {
                                criticalMessages.push(messageViewModel);
                            }
                            else
                            {
                                regularMessages.push(messageViewModel);
                            }
                        }
                    }
                }
    
                const newslist: [];
    
                if (currentPage.LatestNewsContentArea?.FilteredItems != null)
                {
                    newslist: currentPage.LatestNewsContentArea.FilteredItems
                        .map(item: > contentLoader.Get<NewsArticlePage>(item.ContentLink))
                        .filter(article: > article != null)
                        .map(article: > {
                            pageName: article.PageName,
                            mainIntro: article.MainIntro,
                            url: urlResolver.GetUrl(article.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                            language: article.Language.Name,
                            lastChanged: `{(article.LastChanged != default ? article.lastChanged: article.Changed):dd.MM.yyyy}`
                        });
                }
    
                const searchpageUrl: currentPage.SearchPage != null
                    ? urlResolver.GetUrl(currentPage.SearchPage, culture.Name, { contextMode: ContextMode.Default })
                    : null;
    
                const newsarchiveUrl: currentPage.NewsArchiveLocation != null
                    ? urlResolver.GetUrl(currentPage.NewsArchiveLocation, culture.Name, { contextMode: ContextMode.Default })
                    : null;
    
                return {
                    pageName: currentPage.PageName,
                    isUserLoggedIn: isUserLoggedIn,
                    userName: userName,
                    welcomeMessageTitle: localizationService.GetStringByCulture("/welcomemessage/title", culture),
                    welcomeMessageIngress: localizationService.GetStringByCulture("/welcomemessage/ingress", culture),
                    searchPageUrl: searchPageUrl,
                    searchPlaceholder: localizationService.GetStringByCulture("/search/searchaftercontent", culture),
                    searchAriaLabel: localizationService.GetStringByCulture("/search/searcharialabel", culture),
                    searchContentText: currentPage.SearchContentText.IsNullOrWhiteSpace() ? localizationService.GetStringByCulture("/search/searchcontent", culture) : currentPage.SearchContentText,
                    login: currentPage.Login != null
                        ? loginBlockViewModelBuilder.Build(currentPage.Login, withOnPageEdit)
                        : null,
                    alternateLogin: currentPage.AlternateLogin != null
                        ? alternativeLoginBlockViewModelBuilder.Build(currentPage.AlternateLogin, withOnPageEdit)
                        : null,
                    criticalOperationalMessages: criticalMessages,
                    operationalMessages: regularMessages,
                    relevantSchemas: currentPage.RelevantSchemas != null
                        ? relevantSchemasBlockViewModelBuilder.Build(currentPage.RelevantSchemas, withOnPageEdit)
                        : null,
                    companyTitle: localizationService.GetStringByCulture("/common/companytitle", culture),
                    companyText: localizationService.GetStringByCulture("/common/companytext", culture),
                    companyImageUrl: "../../../Static/img/illustration/illustrasjon_regnskap_og_revisjon_sirkel.svg",
                    companyImageAlt: localizationService.GetStringByCulture("/common/illustrationstartcompany", culture),
                    promoBoxArea: currentPage.PromoBoxArea != null ? contentAreaPropsBuilder.Build({
                        contentArea: currentPage.PromoBoxArea,
                        propertyName: "currentPage.PromoBoxArea"
                    }): null,
                    linkButtonArea: currentPage.LinkButtonArea != null
                        ? contentAreaPropsBuilder.Build({
                            contentArea: currentPage.LinkButtonArea,
                            propertyName: "currentPage.LinkButtonArea"
                        })
                        : null,
                    linkButtonAreaTitle: currentPage.LinkButtonAreaText.IsNullOrWhiteSpace() ? localizationService.GetStringByCulture("/common/linkbuttonareatitle", culture): currentPage.LinkButtonAreaText,
                    topImageUrl: "../../../Static/img/illustration/illustrasjon_hjelp_sirkel_1.svg",
                    latestNewsHeading: currentPage.LatestNewsHeading,
                    newsList: newsList,
                    newsArchiveUrl: newsArchiveUrl,
                    showArchiveText: localizationService.GetStringByCulture("/news/showarchive", culture),
                    campaginArea: currentPage.CampaignArea != null ? campaignBlockViewModelBuilder.Build(currentPage.CampaignArea): null,
                    ope: withOnPageEdit ? {} : null
                }
    */
        const bodyData = {
      componentName: "StartPage",
      pageName: cmsPageData.name,
      isUserLoggedIn: false,
      userName: cmsPageData.properties.userName || null,
      welcomeMessageTitle: cmsPageData.properties.welcomeMessageTitle || null,
      welcomeMessageIngress: cmsPageData.properties.welcomeMessageIngress || null,
      searchPageUrl: cmsPageData.properties.searchPageUrl || "/sok/",
      searchPlaceholder: cmsPageData.properties.searchPlaceholder || "S??k",
      searchAriaLabel: cmsPageData.properties.searchAriaLabel || "S??k",
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









