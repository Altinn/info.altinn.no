import type { SchemaPageProps } from "@components/Pages/SchemaPage/SchemaPage.types";
import { type Locale, t } from "@i18n/index";
import { ProviderResolver } from "@services/Providers/ProviderResolver";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildren,
  fetchUmbracoContent,
  fetchUmbracoContentById,
  resolveBlockReferences,
} from "../api/umbraco/client";
import { buildMunicipalitySearch } from "../api/umbraco/municipalitySearch";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { stripCategoryPrefix } from "./categoryPrefix";
import type { IJSONTransformer } from "./IJSONTransformer";
import {
  buildPromoAreaContentArea,
  resolvePromoAreaWithNbFallback,
} from "./promoAreaContact";

// Prefer rich text when an editor has populated it; fall back to the legacy plain-text field.
const richTextOrText = (rich: any, text: any) =>
  rich?.items?.length ? rich : text || undefined;

// Altinn2 form deeplinks must stay environment-relative — an absolute URL like
// `https://www.altinn.no/Pages/...` saved by an editor in tt02 sends users into
// production (issue #673). When the URL is absolute, points at an altinn.no host,
// and its path looks like an Altinn2 form (/Pages/* or /ui/*), strip the origin
// so the browser resolves it against the current environment's host. Other URLs
// (external systems, Altinn3 apps under apps.altinn.no, already-relative paths)
// pass through unchanged.
function normalizeAltinnFormDeeplink(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const isAltinnHost = /(^|\.)altinn\.no$/i.test(url.hostname);
    const isAltinn2Path = /^\/(pages|ui)(\/|$)/i.test(url.pathname);
    if (isAltinnHost && isAltinn2Path) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // Already relative — nothing to strip.
  }
  return raw;
}

export class SchemaPageTransformer implements IJSONTransformer {
  public async Transform(
    cmsPageData: any,
    globalData?: any,
  ): Promise<SchemaPageProps> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale || "nb";
    const contentLocale: Locale = globalData?.contentLocale || locale;
    const resolver = await ProviderResolver.create();

    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, contentLocale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const mainBody = props.mainIntro?.items?.length
      ? {
          items: props.mainIntro.items.map((item: any) => ({
            ...item,
            componentName: item.componentName ?? "RichText",
          })),
        }
      : props.mainIntro || undefined;

    let shallowLinkText: string | undefined;
    if (props.shallowLink) {
      try {
        const url = new URL(props.shallowLink);
        const domain = url.hostname.replace(/^www\./, "");
        shallowLinkText = `${t("schema.shallowLink", locale)} ${domain}`;
      } catch {
        shallowLinkText = t("schema.shallowLink", locale);
      }
    }

    props.accordianList?.items?.forEach((item: any) => {
      item.translatedHeading = t(item.translatedHeading, locale);
    });

    const searchKind = (
      await buildMunicipalitySearch(cmsPageData.route?.path, contentLocale)
    ).kind;
    const isCountySearch = searchKind === "county";
    const hasMunicipalityOrCounty = searchKind !== null;
    const apiSourceUrl = hasMunicipalityOrCounty
      ? `/api/schema/municipalities?path=${encodeURIComponent(cmsPageData.route?.path ?? "")}&locale=${encodeURIComponent(locale)}`
      : undefined;

    // The schema's `providers` is a Content Picker. The Delivery API only returns
    // reference metadata, so resolve each ref via path→id fallback before reading
    // providerAcronym/providerOrgNr from the populated properties.
    const resolvedProviderRefs = await resolveBlockReferences(
      props.providers,
      contentLocale,
    );
    const providerPages = resolvedProviderRefs.map((ref: any) => {
      const name = ref?.name ?? "";
      return {
        ...ref,
        providerIcon: {
          name,
          imageUrl: resolver.resolveImageUrl(
            ref?.properties?.providerAcronym,
            ref?.properties?.providerOrgNr,
            name,
            locale,
          ),
        },
        url: ref?.route?.path,
      };
    });

    // `promoArea` (editor label "Faglig brukerstøtte") is a Block List. Contact
    // blocks render as ProviderContactInformationBlock; other blocks fall back to
    // BlockTransformer's contentType-keyed registry. schemaPage passes no heading
    // fallback, so an unset heading shows no provider name/emblem. The block is
    // only authored on NB content, so fall back to the NB node when the localised
    // value is empty (issue #365).
    const promoAreaData = await resolvePromoAreaWithNbFallback(
      cmsPageData.id,
      props.promoArea,
      contentLocale,
      (id) => fetchUmbracoContentById(id, "nb"),
    );
    const promoArea = buildPromoAreaContentArea(
      promoAreaData,
      (content) => BlockTransformer.TransformBlocks([content]).items[0],
    );

    // Sidebar: schema's tree parent is a providerPage (URL: /skjemaoversikt/<provider>/<schema>/),
    // so the category/subcategory comes from the `subCategories` Content Picker property.
    // Schemas can belong to multiple subcategories; prefer the one the user came from
    // (server-side Referer header), otherwise fall back to the LAST entry — Optimizely
    // had a single subcategory per schema, and during the migration the legacy
    // categorization was preserved at the end of the array while newer classifications
    // (e.g. "Authorizations and qualifications" with NACE-like A–N letters) were
    // prepended at index 0. Picking the last entry matches the legacy "primary"
    // subcategory for migrated schemas and is a no-op for schemas with only one entry.
    const subCategoryRefs = Array.isArray(props.subCategories)
      ? props.subCategories
      : [];

    const normalizePath = (p: string | undefined) =>
      (p || "").replace(/\/+$/, "").toLowerCase();

    let refererPath: string | undefined;
    if (globalData?.referer) {
      try {
        refererPath = normalizePath(new URL(globalData.referer).pathname);
      } catch {
        // Invalid referer — ignore.
      }
    }

    const primarySubCategory =
      (refererPath
        ? subCategoryRefs.find(
            (s: any) => normalizePath(s?.route?.path) === refererPath,
          )
        : undefined) ?? subCategoryRefs[subCategoryRefs.length - 1];

    let pageSidebarViewModel: any;
    if (primarySubCategory?.route?.path) {
      // The category page is the subcategory's tree parent — drop the
      // subcategory's own slug. slice(0, -1) is locale-agnostic; a
      // hardcoded slice(0, 3) skips the /nn/ or /en/ prefix.
      const subSegments = primarySubCategory.route.path
        .split("/")
        .filter(Boolean);
      const parentCategoryPath = `/${subSegments.slice(0, -1).join("/")}/`;

      let parentCategory: any;
      try {
        parentCategory = await fetchUmbracoContent(parentCategoryPath, contentLocale);
      } catch {
        // Category fetch failed — render no sidebar rather than a broken one.
      }

      if (parentCategory) {
        const siblings = await fetchUmbracoChildren(parentCategory.route.path, 100, contentLocale);
        const subItems = siblings
          .filter((sub: any) => sub.contentType === "subCategoryPage")
          .map((sub: any) => ({
            label: stripCategoryPrefix(sub.name),
            url: sub.route?.path,
            current: sub.id === primarySubCategory.id,
          }))
          .sort((a: any, b: any) => a.label.localeCompare(b.label, locale));

        pageSidebarViewModel = {
          titleItem: {
            label: t("schemaOverview.allServices", locale),
            url: "/skjemaoversikt",
            icon: "MenuGridIcon",
          },
          mainItems: [
            {
              label:
                parentCategory.name || t("schema.accordions.category", locale),
              url: parentCategory.route?.path,
              icon: parentCategory.properties?.icon,
              current: false,
              subItems,
            },
          ],
        };
      }
    }

    return {
      componentName: "SchemaPage",
      schemaPageNameText: cmsPageData.name,
      schemaCode: props.schemaCode,
      mainBody,
      operationalMessages: props.operationalMessages || [],
      startSchemaLink: normalizeAltinnFormDeeplink(props.deeplink),
      startSchemaLinkText: t("schema.startSchema", locale),
      buttonInboxText: t("schema.buttonInbox", locale),
      accordianList: props.accordianList,
      providerPages,
      preInstansiated: props.preInstansiated || false,
      schemaNotInUse: props.schemaNotInUse || false,
      deactivateButton: props.deactivateButton || false,
      deadline: richTextOrText(props.deadlineRichText, props.deadline),
      deadlineText: t("schema.deadline", locale),
      processTime: richTextOrText(props.processTimeRichText, props.processTime),
      processTimeText: t("schema.processTime", locale),
      fee: richTextOrText(props.feeRichText, props.fee),
      feeText: t("schema.fee", locale),
      securityLevelInfo: props.securityLevelInfo || undefined,
      shallowLink: props.shallowLink || undefined,
      shallowLinkText,
      promoArea,
      breadcrumb,
      areThereMunicipalities: hasMunicipalityOrCounty && !isCountySearch,
      areThereCounties: isCountySearch,
      apiSourceUrl,
      whatMunicipalityCountyText: hasMunicipalityOrCounty
        ? t(
            isCountySearch ? "schema.whatCounty" : "schema.whatMunicipality",
            locale,
          )
        : undefined,
      searchForMunicipalityCountyText: hasMunicipalityOrCounty
        ? t(
            isCountySearch
              ? "schema.searchForCounty"
              : "schema.searchForMunicipality",
            locale,
          )
        : undefined,
      noHitText: t("schema.noHit", locale),
      orangeMessage: props.orangeMessage || undefined,
      orangeMessageTitle: props.orangeMessageTitle || undefined,
      pageSidebarViewModel,
    };
  }
}
