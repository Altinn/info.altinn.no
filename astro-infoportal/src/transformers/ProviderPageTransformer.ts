import { type Locale, t } from "@i18n/index";
import { ProviderResolver } from "@services/Providers/ProviderResolver";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildren,
  resolveBlockReferences,
} from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import type { IJSONTransformer } from "./IJSONTransformer";

export class ProviderPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale || "nb";
    const resolver = await ProviderResolver.create();

    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, locale);
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
    const children = await fetchUmbracoChildren(cmsPageData.route.path, 100, locale);
    const schemaPages = children.filter((c: any) => c.contentType === "schemaPage");

    const schemas = await Promise.all(
      schemaPages.map(async (schema: any) => {
        const resolvedRefs = await resolveBlockReferences(
          schema.properties?.providers,
          locale,
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

    // `promoArea` (editor label "Faglig brukerstøtte") is a Block List. Items
    // wrap each block as `{ content: { contentType, properties }, settings }`
    // with inline properties (no picker hydration needed). We map the first
    // `formElementContactFreetext` block to a ProviderContactInformationBlock
    // view-model — same shape as on schemaPage.
    const promoBlockItems: any[] = Array.isArray(props.promoArea?.items)
      ? props.promoArea.items
      : [];
    let contactInfo: any;
    for (const wrapper of promoBlockItems) {
      const content = wrapper?.content ?? wrapper;
      if (content?.contentType !== "formElementContactFreetext") continue;
      const bp = content.properties ?? {};
      contactInfo = {
        componentName: "ProviderContactInformationBlock",
        body: bp.body ?? undefined,
        bottomText: bp.bottomText ?? undefined,
        webpageLink: bp.webpageLink ?? undefined,
        telephone: bp.telephone ?? "",
        telephoneLabel: bp.telephoneLabel ?? "",
        email: bp.email ?? "",
        emailTitle: bp.emailTitle ?? "",
        // Editor-supplied heading wins; provider name is the fallback. The
        // emblem only shows when the heading isn't set (matches schemaPage).
        pageName: bp.heading || cmsPageData.name,
        providerIcon: !bp.heading
          ? { name: cmsPageData.name, imageUrl: providerIcon.imageUrl }
          : undefined,
      };
      break;
    }

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
