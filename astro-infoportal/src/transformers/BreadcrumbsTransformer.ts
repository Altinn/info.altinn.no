export class BreadcrumbsTransformer {
  static Transform(ancestors: any, cmsPageData: any): any {
    const breadcrumbs = [{
      linkItem: {
        text: "Start",
        url: "/",
        componentName: "LinkItem"
      }
    }];

    ancestors.forEach((item:any) => {
      const isBreadcrumbVisible =
        item.contentType !== "startPage" &&
        item.contentType !== "themeContainerPage" &&
        (item.properties?.showInNavigation !== false || item.contentType === "themePage");

      if (isBreadcrumbVisible) {
        breadcrumbs.push({
            linkItem: {
              text: item.name,
              url: item.route.path,
              componentName: "LinkItem"
            }
          });
        }
    });

    breadcrumbs.push(
      {
        linkItem: {
          text: cmsPageData.name,
          url: cmsPageData.route.path,
          componentName: "LinkItem"
        }
      }
    );

    return {
      breadcrumbs: breadcrumbs
    }
  }
}
