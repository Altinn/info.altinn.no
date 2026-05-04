import type { IJSONTransformer } from "./IJSONTransformer";
import type { SubsidyOverviewPageProps } from "@components/Pages/SubsidyOverviewPage/SubsidyOverviewPage.types";
import { fetchUmbracoAncestors } from "@api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { t, type Locale } from "@i18n/index";

export class SubsidyOverviewPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<SubsidyOverviewPageProps> {
    const locale: Locale = globalData?.locale || "nb";
    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path, locale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    return {
      ...cmsPageData.properties,
      componentName: "SubsidyOverviewPage",
      pageName: cmsPageData.name,
      mainIntro: cmsPageData.properties.mainIntro || undefined,
      maxItems: cmsPageData.properties.maxItems || 0,
      subsidyApiUrl: `/api/subsidies/${locale}`,
      breadcrumb,
      translations: {
        purposeHeader: t("subsidy.purposeHeader", locale),
        purpose: t("subsidy.purpose", locale),
        purposePlural: t("subsidy.purposePlural", locale),
        industrySingle: t("subsidy.industrySingle", locale),
        industryMultiple: t("subsidy.industryMultiple", locale),
        youHaveChosen: t("subsidy.youHaveChosen", locale),
        choose: t("subsidy.choose", locale),
        showMeSubsidy: t("subsidy.showMeSubsidy", locale),
        noHits: t("subsidy.noHits", locale),
        industryIndependent: t("subsidy.industryIndependent", locale),
        industryIndependentWillShow: t(
          "subsidy.industryIndependentWillShow",
          locale,
        ),
        loadMore: t("subsidy.loadMore", locale),
      },
    };
  }
}
