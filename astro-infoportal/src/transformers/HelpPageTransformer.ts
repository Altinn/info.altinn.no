import {
  makeUniqueSlug,
  slugify,
} from "@components/Shared/RichText/htmlTransforms";
import { type Locale, t } from "@i18n/index";
import { fetchUmbracoAncestors } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { buildHelpSidebarViewModel } from "./helpSidebar";
import type { IJSONTransformer } from "./IJSONTransformer";

function mapAccordion(item: any) {
  return {
    heading: item?.name,
    content: item?.properties?.content,
  };
}

function mapSection(item: any, usedIds: Set<string>) {
  const props = item?.content?.properties ?? {};
  const accordions = (props.accordionList ?? [])
    .map(mapAccordion)
    // Skip accordions the editor left without a heading
    .filter((accordion: any) => accordion.heading);

  return {
    id: item?.content?.id,
    // The slugified heading, used as the section's id so the TOC can link to it
    anchorId: makeUniqueSlug(slugify(props.heading ?? ""), usedIds),
    heading: props.heading,
    leadText: props.mainBody,
    accordions,
  };
}

export class HelpPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    console.log({umbraco: JSON.stringify(cmsPageData)})
    const props = cmsPageData?.properties ?? {};
    const locale: Locale = globalData?.locale ?? "nb";
    const contentLocale: Locale = globalData?.contentLocale ?? locale;
    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, contentLocale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
    const pageSidebarViewModel = await buildHelpSidebarViewModel(
      cmsPageData,
      ancestors,
      contentLocale,
    );

    const usedIds = new Set<string>();
    const sections = (props.helpSections?.items ?? []).map((item: any) =>
      mapSection(item, usedIds),
    );

    return {
      componentName: "HelpPage",
      pageName: cmsPageData?.name,
      leadText: props.leadText,
      sections,
      tableOfContentsLabel: t("help.tableOfContents", locale),
      breadcrumb,
      pageSidebarViewModel,
      isUserLoggedIn: false,
    };
  }
}
