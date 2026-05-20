import type { IJSONTransformer } from "./IJSONTransformer";
import { BlockTransformer } from "./BlockTransformer";
import {
  fetchUmbracoChildren,
  fetchUmbracoContent,
  fetchUmbracoStartPage,
} from "../api/umbraco/client";
import type { SectionPageProps } from "@components/Pages/SectionPage/SectionPage.types";
import { resolveRouteOverride } from "@constants/routeOverrides";
import { type Locale, t } from "@i18n/index";

function isNewsArticle(item: any) {
  return item?.contentType === "newsArticlePage";
}

function normalizeLinkItem(link: any, fallbackText?: string, fallbackUrl?: string) {
  const normalizedLink = Array.isArray(link) ? link[0] : link;
  const text = normalizedLink?.linkText ?? normalizedLink?.text ?? normalizedLink?.title ?? normalizedLink?.name ?? fallbackText;
  const url = normalizedLink?.url ?? normalizedLink?.route?.path ?? fallbackUrl;

  if (!text || !url) {
    return undefined;
  }

  return {
    linkText: text,
    text,
    url: resolveRouteOverride(url),
    openInNewWindow: normalizedLink?.openInNewWindow ?? false,
  };
}

const START_AND_RUN_GUIDES_PATH = "/starte-og-drive/starte/guider/";

async function resolveSectionFeaturedLink(
  cmsPageData: any,
  contentLocale: Locale,
  link: any,
  fallbackText?: string,
) {
  const normalizedLink = normalizeLinkItem(link, fallbackText);

  if (!normalizedLink) {
    return undefined;
  }

  const isStartAndRunGuidesLink =
    cmsPageData.route?.path === "/starte-og-drive/" &&
    normalizedLink.text === "Veiledere innen ulike tema og bransjer";

  if (!isStartAndRunGuidesLink) {
    return normalizedLink;
  }

  try {
    const guidesPage = await fetchUmbracoContent(START_AND_RUN_GUIDES_PATH, contentLocale);
    const guidesUrl = guidesPage.route?.path;

    if (!guidesUrl) {
      return normalizedLink;
    }

    return {
      ...normalizedLink,
      url: guidesUrl,
    };
  } catch {
    return normalizedLink;
  }
}

async function buildLatestNewsItems(
  blockData: any,
  locale: Locale,
  contentLocale: Locale,
) {
  const newsLocation = blockData.properties?.newsLocation?.[0]?.route?.path;

  if (!newsLocation) {
    return [];
  }

  const limit = blockData.properties?.displayLimit ?? 3;
  const children = await fetchUmbracoChildren(newsLocation, limit + 10, contentLocale);
  const newsArticles = children.filter(isNewsArticle).slice(0, limit);

  return await Promise.all(
    newsArticles.map(async (item: any) => {
      const fullArticle = await fetchUmbracoContent(item.id ?? item.route?.path, contentLocale);
      return {
        pageName: fullArticle.name,
        url: fullArticle.route?.path,
        mainIntro: fullArticle.properties?.mainIntro ?? "",
        language: locale,
      };
    }),
  );
}

async function transformSectionContentItem(
  item: any,
  locale: Locale,
  contentLocale: Locale,
  startPageData?: any,
) {
  const blockData = await fetchUmbracoContent(item.id ?? item.route?.path, contentLocale);
  const props = blockData.properties ?? {};

  switch (blockData.contentType) {
    case "contentBlock":
      return {
        componentName: "ContentBlock",
        content: props.content,
      };
    case "doYouNeedHelpBlock":
      return {
        componentName: "DoYouNeedHelpBlock",
        heading: props.heading ?? undefined,
        image: props.image ?? {
          src: "/assets/img/illustrasjon_hjelp_sirkel_2.svg",
        },
        imageAltText: props.imageAltText ?? undefined,
        description: props.description ?? undefined,
        phoneNumber: props.phoneNumber ?? undefined,
        emailLinkText: props.emailLinkText ?? undefined,
        email: props.email ?? undefined,
        showContactFormButton: props.showContactFormButton ?? false,
        contactFormText: props.contactFormText ?? t("support.contactForm", locale),
        labels: props.labels ?? undefined,
        contactFormSchemaId: props.contactFormSchemaId ?? 0,
        showAttachment: props.showAttachment ?? false,
        useRecaptcha:
          props.useRecaptcha ?? startPageData?.properties?.useRecaptcha ?? false,
        recaptchaSiteKey:
          props.recaptchaSiteKey ?? startPageData?.properties?.reCaptchaSiteKey ?? undefined,
        contactFormPageData: props.contactFormPageData ?? undefined,
      };
    case "latestNewsBlock":
    case "latestNewsBlockV2": {
      const archiveLink = normalizeLinkItem(
        props.archiveLink,
        t("news.showArchive", locale),
        props.newsLocation?.[0]?.route?.path ??
          startPageData?.properties?.newsArchiveLocation?.[0]?.route?.path,
      );

      return {
        componentName:
          blockData.contentType === "latestNewsBlockV2"
            ? "LatestNewsBlockV2"
            : "LatestNewsBlock",
        heading: props.heading ?? t("news.latestNews", locale),
        news: await buildLatestNewsItems(blockData, locale, contentLocale),
        archiveLink,
      };
    }
    case "linkBlock":
      return {
        componentName: "LinkBlock",
        fullWidth: props.fullWidth ?? false,
        extraTitle: props.extraTitle ?? undefined,
        link: normalizeLinkItem(props.urlBlock, blockData.name, blockData.route?.path),
      };
    default:
      return {
        componentName:
          blockData.contentType.charAt(0).toUpperCase() +
          blockData.contentType.slice(1),
        ...props,
      };
  }
}

async function transformSectionContentArea(
  area: any,
  locale: Locale,
  contentLocale: Locale,
  startPageData?: any,
) {
  const items = await Promise.all(
    area.map((item: any) =>
      transformSectionContentItem(item, locale, contentLocale, startPageData).catch(() => null),
    ),
  );

  const resolvedItems = items.filter(Boolean);
  if (resolvedItems.length === 0) {
    return undefined;
  }

  return {
    componentName: "ContentArea",
    items: resolvedItems,
  };
}

export class SectionPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<SectionPageProps> {
    const props = cmsPageData.properties ?? {};
    const locale = (globalData?.locale as Locale | undefined) ?? "nb";
    const contentLocale = (globalData?.contentLocale as Locale | undefined) ?? locale;
    const bottomAreaItems = Array.isArray(props.bottomArea) ? props.bottomArea : [];
    const needsStartPageData = bottomAreaItems.some((item: any) =>
      ["doYouNeedHelpBlock", "latestNewsBlock", "latestNewsBlockV2"].includes(
        item?.contentType,
      ),
    );
    const startPageData = needsStartPageData
      ? await fetchUmbracoStartPage(locale)
      : undefined;

    // Always use static asset for background image, never Umbraco media
    const backgroundImage = { src: `/assets/img/illustrasjon_starte_og_drive.svg`, componentName: "Image" };

    const searchForm = props.searchForm
      ? {
          componentName: "SearchForm",
          searchLabel: props.searchForm.searchLabel,
          searchPageUrl: props.searchForm.searchPageUrl,
        }
      : undefined;

    const normalizedGoToLink = await resolveSectionFeaturedLink(
      cmsPageData,
      contentLocale,
      props.goToLinkLocation,
      props.goToLinkText,
    );

    const goToLinkLocation = normalizedGoToLink
      ? {
          componentName: "LinkItem",
          text: normalizedGoToLink.text,
          url: normalizedGoToLink.url,
        }
      : undefined;

    // themePageArea is a flat array of child content items (not a Block List)
    const themePageLinks = Array.isArray(props.themePageArea)
      ? props.themePageArea.map((item: any) => ({
          componentName: "LinkItem",
          text: item.name,
          url: item.route?.path,
        }))
      : [];

    const themeArea = props.themeArea
      ? BlockTransformer.TransformBlocks(props.themeArea)
      : undefined;

    const bottomArea = props.bottomArea
      ? await transformSectionContentArea(props.bottomArea, locale, contentLocale, startPageData)
      : undefined;

    return {
      componentName: "SectionPage",
      pageName: cmsPageData.name,
      heading: props.heading,
      backgroundHexColor: props.backgroundHexColor,
      backgroundImage,
      searchForm,
      goToLinkText: props.goToLinkText,
      goToLinkLocation,
      themePageLinks,
      themeArea,
      bottomArea,
    };
  }
}
