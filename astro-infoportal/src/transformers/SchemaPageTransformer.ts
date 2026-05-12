import type { SchemaPageProps } from "@components/Pages/SchemaPage/SchemaPage.types";
import { type Locale, t } from "@i18n/index";
import { ProviderResolver } from "@services/Providers/ProviderResolver";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildren,
  fetchUmbracoContent,
  resolveBlockReferences,
} from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import type { IJSONTransformer } from "./IJSONTransformer";

// Prefer rich text when an editor has populated it; fall back to the legacy plain-text field.
const richTextOrText = (rich: any, text: any) =>
  rich?.items?.length ? rich : text || undefined;

export class SchemaPageTransformer implements IJSONTransformer {
  public async Transform(
    cmsPageData: any,
    globalData?: any,
  ): Promise<SchemaPageProps> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale || "nb";
    const resolver = await ProviderResolver.create();

    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, locale);
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

    const isCounty = !!props.areThereCounties;
    const hasMunicipalityOrCounty = props.areThereMunicipalities || isCounty;

    // The schema's `providers` is a Content Picker. The Delivery API only returns
    // reference metadata, so resolve each ref via path→id fallback before reading
    // providerAcronym/providerOrgNr from the populated properties.
    const resolvedProviderRefs = await resolveBlockReferences(
      props.providers,
      locale,
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

    // `promoArea` (editor label "Faglig brukerstøtte") is a Block List. Items wrap
    // each block as `{ content: { contentType, id, properties }, settings }`, with
    // properties inline (no picker hydration needed). The `formElementContactFreetext`
    // element type maps to ProviderContactInformationBlock; other block types fall
    // back to BlockTransformer's contentType-keyed registry.
    const promoBlockItems: any[] = Array.isArray(props.promoArea?.items)
      ? props.promoArea.items
      : [];
    const defaultProvider = providerPages[0];
    const promoItems = promoBlockItems
      .map((wrapper: any) => {
        const content = wrapper?.content ?? wrapper;
        const blockProps = content?.properties ?? {};
        if (content?.contentType === "formElementContactFreetext") {
          return {
            componentName: "ProviderContactInformationBlock",
            body: blockProps.body ?? undefined,
            bottomText: blockProps.bottomText ?? undefined,
            webpageLink: blockProps.webpageLink ?? undefined,
            telephone: blockProps.telephone ?? "",
            telephoneLabel: blockProps.telephoneLabel ?? "",
            email: blockProps.email ?? "",
            emailTitle: blockProps.emailTitle ?? "",
            pageName: blockProps.heading || defaultProvider?.name || "",
            // Only show the provider emblem when we fell back to the provider
            // name as the heading. If the editor supplied a `heading`, the
            // card stands on its own without the org logo.
            providerIcon:
              !blockProps.heading && defaultProvider?.providerIcon
                ? {
                    name: defaultProvider.providerIcon.name,
                    imageUrl: defaultProvider.providerIcon.imageUrl,
                  }
                : undefined,
          };
        }
        return BlockTransformer.TransformBlocks([content]).items[0];
      })
      .filter(Boolean);
    const promoArea = promoItems.length
      ? { componentName: "ContentArea", items: promoItems }
      : undefined;

    // Sidebar: schema's tree parent is a providerPage (URL: /skjemaoversikt/<provider>/<schema>/),
    // so the category/subcategory comes from the `subCategories` Content Picker property.
    // Schemas can belong to multiple subcategories; prefer the one the user came from
    // (server-side Referer header), falling back to subCategories[0] (editorial primary).
    // Subcategory URLs look like /skjemaoversikt/kategori/<categorySlug>/<subCategorySlug>/,
    // so the parent category is segments.slice(0, 3) of the subcategory's route.path.
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
        : undefined) ?? subCategoryRefs[0];

    let pageSidebarViewModel: any;
    if (primarySubCategory?.route?.path) {
      const subSegments = primarySubCategory.route.path
        .split("/")
        .filter(Boolean);
      const parentCategoryPath = `/${subSegments.slice(0, 3).join("/")}/`;

      let parentCategory: any;
      try {
        parentCategory = await fetchUmbracoContent(parentCategoryPath, locale);
      } catch {
        // Category fetch failed — render no sidebar rather than a broken one.
      }

      if (parentCategory) {
        const categoryPrefix = parentCategory.name
          ? `${parentCategory.name} - `
          : "";
        const stripPrefix = (name: string) =>
          categoryPrefix && name.startsWith(categoryPrefix)
            ? name.slice(categoryPrefix.length)
            : name;

        const siblings = await fetchUmbracoChildren(parentCategory.route.path);
        const subItems = siblings
          .filter((sub: any) => sub.contentType === "subCategoryPage")
          .map((sub: any) => ({
            label: stripPrefix(sub.name),
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
      startSchemaLink: props.deeplink || undefined,
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
      areThereMunicipalities: props.areThereMunicipalities || false,
      areThereCounties: props.areThereCounties || false,
      apiSourceUrl: props.apiSourceUrl || undefined,
      whatMunicipalityCountyText: hasMunicipalityOrCounty
        ? t(isCounty ? "schema.whatCounty" : "schema.whatMunicipality", locale)
        : undefined,
      searchForMunicipalityCountyText: hasMunicipalityOrCounty
        ? t(
            isCounty
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
