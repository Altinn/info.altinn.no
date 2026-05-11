import { type Locale, t } from "@i18n/index";
import {
  type ProviderInfo,
  ProviderResolver,
} from "@services/Providers/ProviderResolver";
import {
  fetchUmbracoAncestors,
  resolveBlockReferences,
} from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import type { IJSONTransformer } from "./IJSONTransformer";

export class SchemaAttachmentPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale || "nb";
    const resolver = await ProviderResolver.create();

    const ancestors = await fetchUmbracoAncestors(
      cmsPageData.route.path,
      locale,
    );
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const ownerProviders: ProviderInfo[] = [];
    for (const ancestor of ancestors) {
      if (ancestor.contentType !== "providerPage") continue;
      ownerProviders.push({
        name: ancestor.name,
        imageUrl: resolver.resolveImageUrl(
          ancestor.properties?.providerAcronym,
          ancestor.properties?.providerOrgNr,
          ancestor.name ?? "",
          locale,
        ),
        url: ancestor.route?.path ?? "",
      });
    }

    const accordianList = props.accordianList
      ? BlockTransformer.TransformBlocks(props.accordianList)
      : undefined;
    const promoArea = props.promoArea
      ? BlockTransformer.TransformBlocks(props.promoArea)
      : undefined;

    const resolvedSchemas = await resolveBlockReferences(props.schemas, locale);
    const relatedSchemas = await Promise.all(
      resolvedSchemas.map(async (schema: any) => {
        const schemaPath = schema?.route?.path;
        const schemaAncestors = schemaPath
          ? await fetchUmbracoAncestors(schemaPath, locale)
          : [];
        const providers: ProviderInfo[] = schemaAncestors
          .filter((a: any) => a.contentType === "providerPage")
          .map((a: any) => ({
            name: a.name,
            imageUrl: resolver.resolveImageUrl(
              a.properties?.providerAcronym,
              a.properties?.providerOrgNr,
              a.name ?? "",
              locale,
            ),
            url: a.route?.path ?? "",
          }));
        const schemaCode = schema?.properties?.schemaCode;
        const title = schemaCode
          ? `${schema?.name} (${schemaCode})`
          : schema?.name;
        return {
          id: schema?.id,
          title,
          url: schemaPath ?? "",
          providers,
        };
      }),
    );

    return {
      componentName: "SchemaAttachmentPage",
      pageName: cmsPageData.name,
      schemaCode: props.schemaCode || undefined,
      attachmentBadgeText: t("schema.attachment", locale),
      ownerProviders,
      mainIntro: props.mainIntro || undefined,
      orangeMessage: props.orangeMessage || undefined,
      orangeMessageTitle: props.orangeMessageTitle || undefined,
      accordianList,
      whereToFindSchemaText: t("schema.whereToFindSchema", locale),
      relatedSchemas,
      promoArea,
      breadcrumb,
      criticalMessages: props.operationalMessages || [],
      missingTranslation: props.missingTranslation || false,
      missingTranslationText: props.missingTranslation
        ? t("schema.fallbackText", locale)
        : undefined,
    };
  }
}
