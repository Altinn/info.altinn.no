import { stripCategoryPrefix } from "./categoryPrefix";

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

function pathDepth(path?: string): number {
  if (!path) return 0;
  // Count non-empty segments. "/hjelp/" → 1, "/hjelp/a/b/" → 3.
  return path.split("/").filter(Boolean).length;
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

    // Umbraco's ancestors endpoint does not guarantee depth-ordering; sort
    // shallowest-first so the breadcrumb chain reads root → leaf.
    const sortedAncestors = Array.isArray(ancestors)
      ? [...ancestors].sort(
          (a: any, b: any) =>
            pathDepth(a?.route?.path) - pathDepth(b?.route?.path),
        )
      : [];

    sortedAncestors.forEach((item:any) => {
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

    // subCategoryPage names carry a "<Category> - " prefix that the
    // editorial team hasn't always re-translated; strip it so the leaf
    // text is the subcategory's own name.
    const leafText =
      cmsPageData.contentType === "subCategoryPage"
        ? stripCategoryPrefix(cmsPageData.name)
        : cmsPageData.name;

    breadcrumbs.push(
      {
        linkItem: {
          text: leafText,
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
