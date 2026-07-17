import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors, resolveBlockReferences } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { BlockTransformer } from "./BlockTransformer";
import { type Locale, t } from "@i18n/index";

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

// Mirrors the legacy Optimizely ContactListBlockViewModelBuilder shape: i18n labels
// for contactNumberText, and contactFormLocation reshaped from a picker array into
// a LinkItem-ish object. contactFormPageData is attached by
// hydrateNestedContactFormPageData in JSONTransformer.
function mapContactListBlock(props: any, locale: Locale) {
  const locationRefs = Array.isArray(props.contactFormLocation)
    ? props.contactFormLocation
    : [];
  const firstLocation = locationRefs[0];
  const contactFormLocation = firstLocation
    ? {
        text: t("support.contactForm", locale),
        url: firstLocation?.route?.path,
        route: firstLocation?.route,
      }
    : undefined;

  return {
    componentName: "ContactListBlock",
    contactHeading: props.contactHeading ?? undefined,
    text: props.text ?? undefined,
    useContactNumberButton: props.useContactNumberButton ?? false,
    contactNumber: props.contactNumber ?? "",
    contactNumberText: t("support.contactTelephone", locale),
    useContactFormButton: props.useContactFormButton ?? false,
    contactFormLocation,
  };
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
      helpContentRefs,
    ] = await Promise.all([
      resolveBlockReferences(props.newDrilldownPages, contentLocale, isPreview),
      resolveBlockReferences(props.oldDrilldownPages, contentLocale, isPreview),
      resolveBlockReferences(props.questionArea, contentLocale, isPreview),
      resolveBlockReferences(props.helpContentArea, contentLocale, isPreview),
    ]);

    const newDrilldownPages = newDrilldownRefs.map(mapDrilldownPage);
    const oldDrilldownPages = oldDrilldownRefs.map(mapDrilldownPage);
    const questionArea = questionAreaRefs.map(mapQuestionAreaItem).filter(Boolean);

    const helpContentItems = helpContentRefs.map((item: any) => {
      const blockProps = item?.properties ?? {};
      if (item?.contentType === "contactListBlock") {
        return mapContactListBlock(blockProps, locale);
      }
      return BlockTransformer.TransformBlocks([item]).items[0];
    });
    const helpContentArea = helpContentItems.length
      ? { componentName: "ContentArea", items: helpContentItems }
      : undefined;

    const helpSearchPageUrl =
      globalData?.headerViewModel?.searchPageUrl ?? "";

    return {
      componentName: "HelpStartPage",
      breadcrumb,
      pageName: cmsPageData?.name,
      mainIntro: props.mainIntro,
      newVersionHeading: props.newDrillDownTitle || t("help.newVersionHeading", locale),
      newDrilldownPages,
      currentVersionHeading: props.oldDrilldownTitle || t("help.currentVersionHeading", locale),
      oldDrilldownPages,
      questionAreaHeading: props.questionAreaTitle || t("help.questionsYouMayHave", locale),
      questionArea,
      helpContentAreaHeading: props.helpContentAreaTitle || t("help.helpContentAreaHeading", locale),
      helpContentArea,
      searchPlaceholder: props.searchPageTitle || t("search.searchAfterContent", locale),
      helpSearchPageUrl,
      isUserLoggedIn: false,
    };
  }
}
