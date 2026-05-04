import type { IJSONTransformer } from "../IJSONTransformer";
import { fetchUmbracoAncestors } from "../../../api/umbraco/client";
import { BreadcrumbsTransformer } from "../../BreadcrumbsTransformer";

export class HelpStartPageTransformer implements IJSONTransformer {
    public async Transform(cmsPageData:any): Promise<any> {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    const gotoThemeText: localizationService.GetStringByCulture("/help/gototheme", culture);
        
                    // Get pages from NewDrilldownPages ContentArea (in the order set by editor)
                    const newdrilldownPages: [];
                    if (currentPage.NewDrilldownPages?.Items != null)
                    {
                        for (const item of currentPage.NewDrilldownPages.Items)
                        {
                            if (contentLoader.TryGet<HelpDrilldownPage>(item.ContentLink, out const page))
                            {
                                newDrilldownPages.push({
                                    pageName: page.PageName,
                                    triggerWords: page.TriggerWords,
                                    iconUrl: page.Icon != null ? urlResolver.GetUrl(page.Icon) : null,
                                    akselIcon: page.AkselIcon,
                                    altImage: page.AltImage,
                                    url: urlResolver.GetUrl(page.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                                    goToThemeText: goToThemeText
                                });
                            }
                        }
                    }
        
                    // Get pages from OldDrilldownPages ContentArea (in the order set by editor)
                    const olddrilldownPages: [];
                    if (currentPage.OldDrilldownPages?.Items != null)
                    {
                        for (const item of currentPage.OldDrilldownPages.Items)
                        {
                            if (contentLoader.TryGet<HelpDrilldownPage>(item.ContentLink, out const page))
                            {
                                oldDrilldownPages.push({
                                    pageName: page.PageName,
                                    triggerWords: page.TriggerWords,
                                    iconUrl: page.Icon != null ? urlResolver.GetUrl(page.Icon) : null,
                                    akselIcon: page.AkselIcon,
                                    altImage: page.AltImage,
                                    url: urlResolver.GetUrl(page.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                                    goToThemeText: goToThemeText
                                });
                            }
                        }
                    }
        
                    const startpage: contentLoader.Get<StartPage>(ContentReference.StartPage);
                    const searchpageUrl: startPage.SearchPage != null
                        ? urlResolver.GetUrl(startPage.SearchPage, culture.Name, { contextMode: ContextMode.Default })
                        : "";
        
                    const questionareaItems: [];
                    if (currentPage.QuestionArea?.Items != null)
                    {
                        for (const item of currentPage.QuestionArea.Items)
                        {
                            if (contentLoader.TryGet<SitePageData>(item.ContentLink, out const page))
                            {
                                if isHelpQuestionPage((page) questionPage)
                                {
                                    questionAreaItems.push({
                                        pageName: questionPage.PageName,
                                        pageType: "HelpQuestionPage",
                                        url: urlResolver.GetUrl(questionPage.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                                        body: richTextAreaPropsBuilder.Build({ richTextArea: questionPage.MainBody })
                                    });
                                }
                                else if isHelpProcessArticlePage((page) articlePage)
                                {
                                    questionAreaItems.push({
                                        pageName: articlePage.PageName,
                                        pageType: "HelpProcessArticlePage",
                                        url: urlResolver.GetUrl(articlePage.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                                        body: richTextAreaPropsBuilder.Build({ richTextArea: articlePage.MainBody })
                                    });
                                }
                            }
                        }
                    }
        
                    return {
                        breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                        pageName: localizationService.GetStringByCulture("/menu/helptext", culture),
                        mainIntro: currentPage.MainIntro,
                        newVersionHeading: currentPage.NewDrillDownTitle ?? localizationService.GetStringByCulture("/help/newversionheading", culture),
                        newDrilldownPages: newDrilldownPages,
                        currentVersionHeading: currentPage.OldDrilldownTitle ?? localizationService.GetStringByCulture("/help/currentversionheading", culture),
                        oldDrilldownPages: oldDrilldownPages,
                        questionAreaHeading: currentPage.QuestionAreaTitle ?? localizationService.GetStringByCulture("/help/questionyoumayhave", culture),
                        questionArea: questionAreaItems,
                        helpContentAreaHeading: currentPage.HelpContentAreaTitle ?? localizationService.GetStringByCulture("/help/helpcontentareaheading", culture),
                        helpContentArea: contentAreaPropsBuilder.Build({
                            contentArea: currentPage.HelpContentArea,
                            propertyName: "currentPage.HelpContentArea"
                        }),
                        searchPlaceholder: currentPage.SearchPageTitle ?? localizationService.GetStringByCulture("/search/searchaftercontent", culture),
                        helpSearchPageUrl: searchPageUrl,
                        searchAriaLabel: localizationService.GetStringByCulture("/search/searcharialabel", culture),
                        ope: withOnPageEdit ? {} : null,
                    }
        */
                const props = cmsPageData?.properties ?? {};
        const ancestors = await fetchUmbracoAncestors(cmsPageData.id);
        const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
        let bodyData = {
            componentName: "HelpStartPage",
            breadcrumb: breadcrumb,
            pageName: cmsPageData?.name ?? null,
            mainIntro: props?.mainIntro ?? null,
            newVersionHeading: props?.newVersionHeading ?? null,
            newDrilldownPages: props?.newDrilldownPages ?? null,
            currentVersionHeading: props?.currentVersionHeading ?? null,
            oldDrilldownPages: props?.oldDrilldownPages ?? null,
            questionAreaHeading: props?.questionAreaHeading ?? null,
            questionArea: props?.questionArea ?? null,
            helpContentAreaHeading: props?.helpContentAreaHeading ?? null,
            helpContentArea: props?.helpContentArea ?? null,
            searchPlaceholder: props?.searchPlaceholder ?? null,
            helpSearchPageUrl: props?.helpSearchPageUrl ?? null,
            searchAriaLabel: props?.searchAriaLabel ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}










