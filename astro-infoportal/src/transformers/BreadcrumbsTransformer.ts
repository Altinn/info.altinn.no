const BREADCRUMB_URL_OVERRIDES: Array<{
  currentPath: string;
  ancestorPath: string;
  targetPath: "current" | string;
}> = [
  {
    currentPath: "/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
    ancestorPath: "/starte-og-drive/dokumentmaler/",
    targetPath: "current",
  },
];

function getBreadcrumbUrl(item: any, cmsPageData: any): string {
  const currentPath = cmsPageData?.route?.path || "";
  const ancestorPath = item?.route?.path || "";

  const override = BREADCRUMB_URL_OVERRIDES.find(
    (candidate) =>
      candidate.currentPath === currentPath &&
      candidate.ancestorPath === ancestorPath,
  );

  if (!override) {
    return ancestorPath;
  }

  return override.targetPath === "current"
    ? currentPath
    : override.targetPath;
}

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
      // providerPage-noder har `showInNavigation: false` i CMS for å skjules
      // i meny og drilldowns, men de skal være med i brødsmulestien
      // (`Start > Skjemaoversikt > Skatteetaten > Avskrivning`).
      const isBreadcrumbVisible =
        item.contentType !== "startPage" &&
        item.contentType !== "themeContainerPage" &&
        (item.properties?.showInNavigation !== false ||
          item.contentType === "themePage" ||
          item.contentType === "providerPage");

      if (isBreadcrumbVisible) {
        breadcrumbs.push({
            linkItem: {
              text: item.name,
              url: getBreadcrumbUrl(item, cmsPageData),
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
