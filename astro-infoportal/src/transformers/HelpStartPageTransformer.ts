import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors, resolveBlockReferences } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { buildContactBlocks } from "./contactBlocks";
import { type Locale, t } from "@i18n/index";

function mapDrilldownPage(item: any) {
  const props = item?.properties ?? {};
  return {
    pageName: item?.name,
    url: item?.route?.path,
    akselIcon: props.akselIcon,
    // Editorial one-liner shown under the card title on the help start page.
    // Distinct from triggerWords, which stays hidden and only feeds the search index.
    description: props.description,
    triggerWords: props.triggerWords,
    altImage: props.altImage,
  };
}

function mapQuestionAreaItem(item: any) {
  const props = item?.properties ?? {};
  const ct = item?.contentType;
  // Reusable question/answer element, the same type HelpPage uses for its
  // accordions: the name is the question and `content` the answer.
  if (ct === "helpDetails") {
    return {
      pageName: item?.name,
      body: props.content,
    };
  }
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
    const locale: Locale = globalData?.locale || "nb";
    const contentLocale: Locale = globalData?.contentLocale || locale;
    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, contentLocale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
    const isPreview = globalData?.isPreview;

    // Drilldown/question/contact picker refs arrive with `properties: {}`;
    // hydrate each ref so the mappers below have access to inline properties
    // (icon, triggerWords, mainBody, contact fields).
    const [
      newDrilldownRefs,
      oldDrilldownRefs,
      questionAreaRefs,
      contactBlocks,
    ] = await Promise.all([
      resolveBlockReferences(props.newDrilldownPages, contentLocale, isPreview),
      resolveBlockReferences(props.oldDrilldownPages, contentLocale, isPreview),
      resolveBlockReferences(props.questionArea, contentLocale, isPreview),
      buildContactBlocks(props.contactBlocks, locale, contentLocale, isPreview),
    ]);

    const newDrilldownPages = newDrilldownRefs.map(mapDrilldownPage);
    const oldDrilldownPages = oldDrilldownRefs.map(mapDrilldownPage);
    const questionArea = questionAreaRefs.map(mapQuestionAreaItem).filter(Boolean);

    const helpSearchPageUrl =
      globalData?.headerViewModel?.searchPageUrl ?? "";

    return {
      componentName: "HelpStartPage",
      breadcrumb,
      pageName: cmsPageData?.name,
      mainIntro: props.mainIntro,
      // Editor-written heading and interface fallback stay separate so the
      // component can mark only the fallback when the page fell back to
      // bokmål content in an English interface (issue #713).
      newVersionHeading: props.newDrillDownTitle || undefined,
      translatedNewVersionHeading: t("help.newVersionHeading", locale),
      newDrilldownPages,
      currentVersionHeading: props.oldDrilldownTitle || undefined,
      translatedCurrentVersionHeading: t("help.currentVersionHeading", locale),
      oldDrilldownPages,
      questionAreaHeading: props.questionAreaTitle || undefined,
      translatedQuestionAreaHeading: t("help.questionsYouMayHave", locale),
      questionArea,
      contactBlocksHeading: props.contactBlocksHeading || undefined,
      translatedContactBlocksHeading: t("help.helpContactBlockHeading", locale),
      contactBlocks,
      searchHeading: props.searchPageTitle || undefined,
      translatedSearchHeading: t("search.searchAfterContent", locale),
      searchPlaceholder: props.searchPageTitle || t("search.searchAfterContent", locale),
      helpSearchPageUrl,
      isUserLoggedIn: false,
    };
  }
}
