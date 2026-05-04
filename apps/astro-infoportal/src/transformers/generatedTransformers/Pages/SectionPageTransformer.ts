import type { IJSONTransformer } from "../IJSONTransformer";
import { BlockTransformer } from "../BlockTransformer";
import { BreadcrumbsTransformer } from "../BreadcrumbsTransformer";

export class SectionPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    /* C# logic (TS-ish++):
    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
    
                const themepageLinks: currentPage.ThemePageArea?.FilteredItems
                    .map(item: >
                    {
                        if (item?.contentLink: = null || ContentReference.IsNullOrEmpty(item.ContentLink)) return null;
                        if (!contentLoader.TryGet(item.ContentLink, out SitePageData page)) return null;
                        return linkItemViewModelBuilder.Build(page.PageName, page.ContentLink);
                    })
                    .filter(x: > x != null)
                    ;
    
                string backgroundhexColor: null;
                if (currentPage.BackgroundImage != null && !ContentReference.IsNullOrEmpty(currentPage.BackgroundImage))
                {
                    if (contentLoader.TryGet(currentPage.BackgroundImage, out Optimizely.Media.VectorImageFile vImg))
                    {
                        backgroundhexColor: vImg?.HexBackGroundColor;
                    }
                }
    
                // Get search page URL
                const searchpageRef: ContentReference.StartPage;
                const searchpageUrl: "/sok"; // Default fallback
    
                if (contentLoader.TryGet(searchPageRef, out SitePageData startPage))
                {
                    const searchpages: contentLoader.GetChildren<SearchPage>(searchPageRef)
                        .FilterForDisplay();
                    const searchpage: searchPages[0] ?? null;
                    if (searchPage != null)
                    {
                        searchpageUrl: urlResolver.GetUrl(searchPage.ContentLink);
                    }
                }
    
                return {
                    pageName: currentPage.PageName,
                    heading: currentPage.Heading,
                    backgroundImage: imagePropsBuilder.Build(currentPage.BackgroundImage),
                    backgroundHexColor: backgroundHexColor,
                    searchForm: {
                        searchLabel: localizationService.GetStringByCulture("/search/search", culture), // Norwegian for "Search"
                        query: "",
                        preamble: null,
                        searchPageUrl: searchPageUrl
                    },
                    themePageArea: contentAreaPropsBuilder.Build({
                        contentArea: currentPage.ThemePageArea,
                        propertyName: "currentPage.ThemePageArea"
                    }),
                    themePageLinks: themePageLinks,
                    goToLinkText: currentPage.GoToLinkText,
                    goToLinkLocation: linkItemViewModelBuilder.Build(currentPage.GoToLinkText, currentPage.GoToLinkLocation),
                    themeArea: contentAreaPropsBuilder.Build({
                        contentArea: currentPage.ThemeArea,
                        propertyName: "currentPage.ThemeArea"
                    }),
                    bottomArea: contentAreaPropsBuilder.Build({
                        contentArea: currentPage.BottomArea,
                        propertyName: "currentPage.BottomArea"
                    }),
                    ope: withOnPageEdit ? {} : null
                }
    */
        const props = cmsPageData.properties ?? {};

    // Always use static asset for background image, never Umbraco media
    const backgroundImage = { src: `/assets/img/illustrasjon_starte_og_drive.svg`, componentName: "Image" };

    const searchForm = props.searchForm
      ? {
          componentName: "SearchForm",
          searchLabel: props.searchForm.searchLabel,
          searchPageUrl: props.searchForm.searchPageUrl,
        }
      : undefined;

    const goToLinkLocation = props.goToLinkLocation
      ? {
          componentName: "LinkItem",
          text: props.goToLinkLocation.text ?? props.goToLinkText,
          url: props.goToLinkLocation.url,
        }
      : undefined;

    // themePageArea is a flat array of child content items (not a Block List)
    const themePageLinks = Array.isArray(props.themePageArea)
      ? props.themePageArea.map((item: any) => ({
          componentName: "LinkItem",
          text: item.name,
          url: item.route?.path,
        }))
      : [];

    const themeArea = props.themeArea
      ? BlockTransformer.TransformBlocks(props.themeArea)
      : undefined;

    const bottomArea = props.bottomArea
      ? BlockTransformer.TransformBlocks(props.bottomArea)
      : undefined;

    return {
      componentName: "SectionPage",
      pageName: cmsPageData.name,
      heading: props.heading,
      backgroundHexColor: props.backgroundHexColor,
      backgroundImage,
      searchForm,
      goToLinkText: props.goToLinkText,
      goToLinkLocation,
      themePageLinks,
      themeArea,
      bottomArea,
    };
  }
}









