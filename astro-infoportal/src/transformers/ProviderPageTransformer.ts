import { type Locale, t } from "@i18n/index";
import { ProviderResolver } from "@services/Providers/ProviderResolver";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildren,
  fetchUmbracoContentById,
  resolveBlockReferences,
} from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import type { IJSONTransformer } from "./IJSONTransformer";
import {
  buildProviderContactInfo,
  resolvePromoAreaWithNbFallback,
} from "./promoAreaContact";

export class ProviderPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale || "nb";
    const contentLocale: Locale = globalData?.contentLocale || locale;
    const isPreview = globalData?.isPreview;
    const resolver = await ProviderResolver.create();

    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, contentLocale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const providerImageUrl = resolver.resolveImageUrl(
      props.providerAcronym,
      props.providerOrgNr,
      cmsPageData.name ?? "",
      locale,
    );
    const providerIcon = {
      name: cmsPageData.name,
      imageUrl: providerImageUrl,
      type: "company" as const,
    };

    // Each schema's `providers` is a Content Picker; the Delivery API only returns
    // reference metadata, so we resolve each ref via path→id fallback (see
    // .claude/docs/architecture.md).
    // Some providers (e.g. Skatteetaten) have >100 child schemas; take is the
    // API's max int. schemaAttachmentPage is a sibling content type — same
    // editorial role as schemaPage (a service the provider offers, with
    // schemaCode/providers/URL), so it must be listed too.
    const children = await fetchUmbracoChildren(
      cmsPageData.route.path,
      2147483647,
      contentLocale,
      isPreview
    );
    const schemaPages = children.filter(
      (c: any) =>
        c.contentType === "schemaPage" ||
        c.contentType === "schemaAttachmentPage",
    );

    const schemas = await Promise.all(
      schemaPages.map(async (schema: any) => {
        const resolvedRefs = await resolveBlockReferences(
          schema.properties?.providers,
          contentLocale,
          isPreview,
        );
        const providers = resolvedRefs.map((ref: any) => {
          const name = ref?.name ?? "";
          return {
            name,
            imageUrl: resolver.resolveImageUrl(
              ref?.properties?.providerAcronym,
              ref?.properties?.providerOrgNr,
              name,
              locale,
            ),
            url: ref?.route?.path ?? "",
          };
        });
        const schemaCode = schema.properties?.schemaCode;
        return {
          id: schema.id,
          title: schemaCode ? `${schema.name} (${schemaCode})` : schema.name,
          url: schema.route?.path,
          providers,
        };
      }),
    );
    schemas.sort((a: any, b: any) => a.title.localeCompare(b.title, locale));

    // `promoArea` (editor label "Faglig brukerstøtte") is a Block List. We map
    // the first contact block to a ProviderContactInformationBlock view-model,
    // using the provider name + emblem as the heading fallback (the emblem only
    // shows when the editor left the heading unset). The block is only authored
    // on NB content, so fall back to the NB node when the localised value is
    // empty (issue #365).
    const promoAreaData = await resolvePromoAreaWithNbFallback(
      cmsPageData.id,
      props.promoArea,
      contentLocale,
      (id) => fetchUmbracoContentById(id, "nb", isPreview),
    );
    const contactInfo = buildProviderContactInfo(promoAreaData, {
      name: cmsPageData.name,
      imageUrl: providerIcon.imageUrl,
    });

    const pageSidebarViewModel = {
      titleItem: {
        label: t("schemaOverview.allProviders", locale),
        url: "/skjemaoversikt?category=provider",
        icon: "PassportIcon",
      },
    };

    return {
      componentName: "ProviderPage",
      pageName: cmsPageData.name,
      mainIntro: props.mainIntro || undefined,
      breadcrumb,
      providerIcon,
      schemas,
      contactInfo,
      pageSidebarViewModel,
    };
  }
}
