import type { IJSONTransformer } from "./IJSONTransformer";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildrenInEditorOrder,
  fetchUmbracoContent,
  resolveBlockReferences,
} from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { type Locale, t } from "@i18n/index";

// Mirrors the legacy Optimizely CampaignBlockViewModelBuilder. Umbraco's link
// editor stores a plain URL string, but the component expects { url, text }.
// Use the block's content name as heading text (the picked node's name).
function mapCampaignBlock(item: any) {
  const props = item?.properties ?? {};
  const rawLink = props.link;
  const linkUrl =
    typeof rawLink === "string" ? rawLink : rawLink?.url ?? undefined;
  const linkText =
    typeof rawLink === "string"
      ? item?.name ?? ""
      : rawLink?.text ?? item?.name ?? "";
  return {
    componentName: "CampaignBlock",
    link: linkUrl ? { url: linkUrl, text: linkText } : null,
    description: props.description ?? null,
  };
}

// Mirrors the legacy Optimizely ContactListBlockViewModelBuilder: contactNumberText
// always comes from i18n, and the contactFormLocation MNTP ref is reshaped into a
// LinkItem-ish object with localized link text. contactFormPageData is attached
// later by hydrateNestedContactFormPageData in JSONTransformer.
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

const articleContentTypes = new Set([
  "articlePage",
  "sectionArticlePage",
  "helpDrilldownPage",
  "aboutPage",
  "subsidyPage",
  "schemaPage",
]);

const childLinkContentTypes = new Set([
  "articlePage",
  "sectionArticlePage",
]);

const contentTypesWithChildLinks = new Set([
  "sectionArticlePage",
  "themeContainerPage",
]);

const systemFolderContentTypes = new Set([
  "sysContentAssetFolder",
  "sysContentFolder",
]);

export class ThemePageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale || "nb";
    const contentLocale: Locale = globalData?.contentLocale || locale;
    const isPreview: boolean = globalData?.isPreview;

    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, contentLocale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const allChildren = await fetchUmbracoChildrenInEditorOrder(cmsPageData.route.path, 100, contentLocale, isPreview);
    const children = allChildren.filter(
      (c: any) =>
        c.properties?.showInNavigation !== false &&
        !systemFolderContentTypes.has(c.contentType),
    );

    const themeGroups = await Promise.all(
      children.map(async (child: any) => {
        const isArticle = articleContentTypes.has(child.contentType);
        const shouldFetchChildLinks = contentTypesWithChildLinks.has(child.contentType);
        let intro = child.properties?.mainIntro ?? null;
        let childPages: any[] = [];

        if (isArticle && !intro && child.route?.path) {
          try {
            const fullArticle = await fetchUmbracoContent(child.route.path, contentLocale, undefined, isPreview);
            intro = fullArticle.properties?.mainIntro ?? null;
          } catch {
            intro = null;
          }
        }

        if (shouldFetchChildLinks && child.route?.path) {
          const allChildPages = await fetchUmbracoChildrenInEditorOrder(child.route.path, 100, contentLocale, isPreview);
          childPages = allChildPages.filter(
            (c: any) =>
              childLinkContentTypes.has(c.contentType) &&
              c.properties?.showInNavigation !== false,
          );
        }

        const mappedChildPages = childPages.map((sub: any) => ({
          componentName: "LinkItem",
          text: sub.name,
          url: sub.route?.path,
        }));

        return {
          type: isArticle ? "article" : "container",
          title: child.name,
          intro: isArticle ? intro : null,
          url: isArticle ? (child.route?.path ?? null) : null,
          childPages: mappedChildPages,
        };
      }),
    );

    // `bottomContentArea` (editor label "Faglig brukerstøtte") is a Content Picker.
    // Refs arrive with `properties: {}`; hydrate them, then map known block types
    // (mirroring legacy Optimizely ViewModelBuilders) so the React components receive
    // the shape they expect. Unknown types fall through to BlockTransformer.
    const hydratedBottomItems = await resolveBlockReferences(
      props.bottomContentArea,
      contentLocale,
      isPreview,
    );
    const bottomItems = hydratedBottomItems.map((item: any) => {
      const blockProps = item?.properties ?? {};
      if (item?.contentType === "contactListBlock") {
        return mapContactListBlock(blockProps, locale);
      }
      if (item?.contentType === "campaignBlock") {
        return mapCampaignBlock(item);
      }
      return BlockTransformer.TransformBlocks([item]).items[0];
    });
    const bottomContentArea = bottomItems.length
      ? { componentName: "ContentArea", items: bottomItems }
      : undefined;

    return {
      componentName: "ThemePage",
      pageName: cmsPageData.name,
      mainIntro: props.mainIntro,
      breadcrumb: breadcrumb,
      themeGroups,
      bottomContentArea,
    };
  }
}
