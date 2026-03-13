import type { IJSONTransformer } from "./IJSONTransformer";

export class ThemePageTransformer implements IJSONTransformer {
  public Transform(cmsPageData: any): any {
    const bodyData = {
      componentName: "ThemePage",
      mainIntro: cmsPageData.mainIntro,
      themeGroups: [],
      pageName: cmsPageData.name,
      bottomContentArea: {},
      breadcrumb: [],
    };

    //bodyData.themeGroups = this.TransformThemeGroups(cmsPageData);

    return bodyData;
  }

  /* private TransformThemeGroups(cmsPageData:any):any {
            var themeGroups = [];

            var themePageChildren = contentRepository.GetChildren<SitePageData>(currentPage.ContentLink)
                .FilterForDisplay()
                .Where(x => x.VisibleInMenu && x is IThemeSitePages)
                .ToList();

            foreach (var child in themePageChildren)
            {
                var childPages = contentRepository.GetChildren<SitePageData>(child.ContentLink)
                    .FilterForDisplay()
                    .Where(x => x.VisibleInMenu)
                    .Select(x => new LinkItemViewModel
                    {
                        Text = x.PageName,
                        Url = urlResolver.GetUrl(x.ContentLink)
                    })
                    .ToList();

                if (child is ArticlePageBase articlePage)
                {
                    themeGroups.Add(new ThemeGroupItemViewModel
                    {
                        Type = "article",
                        Title = articlePage.PageName,
                        Intro = articlePage.MainIntro,
                        Url = urlResolver.GetUrl(articlePage.ContentLink),
                        ChildPages = childPages
                    });
                }
                else if (child is ThemeContainerPage containerPage)
                {
                    themeGroups.Add(new ThemeGroupItemViewModel
                    {
                        Type = "container",
                        Title = containerPage.PageName,
                        Intro = null,
                        Url = null,
                        ChildPages = childPages
                    });
                }
            }
    }*/
}
