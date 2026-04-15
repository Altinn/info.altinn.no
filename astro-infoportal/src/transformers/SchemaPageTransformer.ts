import type { SchemaPageProps } from "@components/Pages/SchemaPage/SchemaPage.types";
import { type Locale, t } from "@i18n/index";
import { fetchUmbracoAncestors } from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import type { IJSONTransformer } from "./IJSONTransformer";

export class SchemaPageTransformer implements IJSONTransformer {
  public async Transform(
    cmsPageData: any,
    globalData?: any,
  ): Promise<SchemaPageProps> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale || "nb";

    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const accordianList = props.accordianList?.length
      ? {
          items: props.accordianList.map((item: any) => ({
            translatedHeading: item.name,
            description: item.description,
            componentName: "SchemaAccordianBlock",
          })),
        }
      : undefined;

    const mainBody = props.mainIntro?.items?.length
      ? {
          items: props.mainIntro.items.map((item: any) => ({
            translatedHeading: item.name,
            html: item.html,
            componentName: "RichText",
          })),
        }
      : props.mainIntro || undefined;

    const promoArea = props.promoArea
      ? BlockTransformer.TransformBlocks(props.promoArea)
      : undefined;

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

    const isCounty = !!props.areThereCounties;
    const hasMunicipalityOrCounty = props.areThereMunicipalities || isCounty;

    return {
      componentName: "SchemaPage",
      schemaPageNameText: cmsPageData.name,
      schemaCode: props.schemaCode,
      mainBody,
      operationalMessages: props.operationalMessages || [],
      startSchemaLink: props.deeplink || undefined,
      startSchemaLinkText: t("schema.startSchema", locale),
      buttonInboxText: t("schema.buttonInbox", locale),
      accordianList,
      providerPages: props.providerPages || [],
      preInstansiated: props.preInstansiated || false,
      schemaNotInUse: props.schemaNotInUse || false,
      deactivateButton: props.deactivateButton || false,
      deadline: props.deadline || undefined,
      deadlineText: t("schema.deadline", locale),
      processTime: props.processTime || undefined,
      processTimeText: t("schema.processTime", locale),
      fee: props.fee || undefined,
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
    };
  }
}
