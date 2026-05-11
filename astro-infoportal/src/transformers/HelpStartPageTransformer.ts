import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { BlockTransformer } from "./BlockTransformer";

function mapDrilldownPage(item: any) {
  const props = item?.properties ?? {};
  return {
    pageName: item?.name,
    url: item?.route?.path,
    akselIcon: props.akselIcon,
    triggerWords: props.triggerWords,
    altImage: props.altImage,
  };
}

function mapQuestionAreaItem(item: any) {
  const props = item?.properties ?? {};
  const ct = item?.contentType;
  if (ct === "helpQuestionPage" || ct === "helpProcessArticlePage") {
    return {
      pageName: item?.name,
      pageType: ct === "helpQuestionPage" ? "HelpQuestionPage" : "HelpProcessArticlePage",
      url: item?.route?.path,
      body: props.mainBody,
    };
  }
  return null;
}

export class HelpStartPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData?.properties ?? {};
    const ancestors = await fetchUmbracoAncestors(cmsPageData.route?.path ?? cmsPageData.id);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const newDrilldownPages = Array.isArray(props.newDrilldownPages)
      ? props.newDrilldownPages.map(mapDrilldownPage)
      : [];
    const oldDrilldownPages = Array.isArray(props.oldDrilldownPages)
      ? props.oldDrilldownPages.map(mapDrilldownPage)
      : [];
    const questionArea = Array.isArray(props.questionArea)
      ? props.questionArea.map(mapQuestionAreaItem).filter(Boolean)
      : [];

    const helpContentArea = props.helpContentArea
      ? BlockTransformer.TransformBlocks(props.helpContentArea)
      : undefined;

    const helpSearchPageUrl =
      globalData?.headerViewModel?.searchPageUrl ?? "";

    return {
      componentName: "HelpStartPage",
      breadcrumb,
      pageName: cmsPageData?.name,
      mainIntro: props.mainIntro,
      newVersionHeading: props.newDrillDownTitle,
      newDrilldownPages,
      currentVersionHeading: props.oldDrillDownTitle,
      oldDrilldownPages,
      questionAreaHeading: props.questionAreaTitle,
      questionArea,
      helpContentAreaHeading: props.helpContentAreaTitle,
      helpContentArea,
      searchPlaceholder: props.searchPageTitle,
      helpSearchPageUrl,
      isUserLoggedIn: false,
    };
  }
}
