export class BreadcrumbsTransformer {
  static Transform(ancestors: any, cmsPageData: any): any {
    var breadcrumbs = [{
      linkItem: {
        text: "Start",
        url: "/",
        componentName: "LinkItem"
      }
    }];
    
    ancestors.map((item:any) => {
      if (item.properties.showInNavigation && item.contentType !== "categoryListPage" && item.contentType !== "startPage") {
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
