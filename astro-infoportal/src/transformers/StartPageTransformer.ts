import {
  fetchUmbracoContent,
  resolveBlockReferences,
} from "@api/umbraco/client";
import { type Locale, t } from "@i18n/index";
import {
  type ProviderInfo,
  ProviderResolver,
} from "@services/Providers/ProviderResolver";
import type { IJSONTransformer } from "./IJSONTransformer";
import { transformOperationalMessageArticle } from "./OperationalMessageArticlePageTransformer";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

export class StartPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const locale: Locale = globalData?.locale || "nb";
    const contentLocale: Locale = globalData?.contentLocale || locale;
    const resolver = await ProviderResolver.create();
    const p = cmsPageData.properties ?? {};

    // --- Operational messages from AlertArea ---
    const alertRefs: any[] = p.alertArea ?? [];
    const alertMessages = (
      await Promise.all(
        alertRefs.map(async (ref: any) => {
          const route = ref.route?.path;
          if (!route) return null;
          try {
            const full = await fetchUmbracoContent(route, contentLocale);
            return transformOperationalMessageArticle(full);
          } catch {
            return null;
          }
        }),
      )
    ).filter(Boolean);
    const criticalOperationalMessages = alertMessages.filter(
      (message: any) => message.isCritical || message.colorVariant === "danger",
    );
    const operationalMessages = alertMessages.filter(
      (message: any) =>
        !message.isCritical && message.colorVariant !== "danger",
    );

    // --- Link buttons (built from inboxUrl, profilUrl, schemaReference) ---
    const linkButtons: any[] = [];
    if (p.inboxUrl) {
      linkButtons.push({
        componentName: "LinkButtonBlock",
        link: { text: t("start.checkInbox", locale), url: p.inboxUrl },
        icon: "InboxIcon",
        buttonType: "Primary",
        displayOptionId: "full",
      });
    }
    if (p.profilUrl) {
      linkButtons.push({
        componentName: "LinkButtonBlock",
        link: { text: t("start.accessManagement", locale), url: p.profilUrl },
        icon: "PadlockLockedIcon",
        buttonType: "Default",
        displayOptionId: "full",
      });
    }
    const schemaRef = p.schemaReference?.[0];
    if (schemaRef) {
      linkButtons.push({
        componentName: "LinkButtonBlock",
        link: {
          text: t("start.findSchema", locale),
          url: schemaRef.route?.path || "/skjemaoversikt/",
        },
        icon: "MenuGridIcon",
        buttonType: "Default",
        displayOptionId: "full",
      });
    }
    const linkButtonArea = { componentName: "ContentArea", items: linkButtons };

    // --- Promo boxes (fetch full content for each promoBoxArea item) ---
    const promoBoxItems: any[] = [];
    for (const block of p.promoBoxArea ?? []) {
      const route = block.route?.path;
      if (!route) continue;
      try {
        const full = await fetchUmbracoContent(route, contentLocale);
        promoBoxItems.push({
          componentName: "PromoBoxBlock",
          link: full.properties?.link || null,
          text: full.properties?.text || null,
          image: null,
          displayOptionId: "full",
        });
      } catch {
        // skip blocks that can't be fetched
      }
    }
    const promoBoxArea = { componentName: "ContentArea", items: promoBoxItems };

    // --- Relevant schemas (from schemaOverviewPage's recommendedSchemas) ---
    let relevantSchemas = null;
    if (schemaRef?.route?.path) {
      try {
        const schemaPage = await fetchUmbracoContent(
          schemaRef.route.path,
          contentLocale,
        );
        const recommended = schemaPage.properties?.recommendedSchemas ?? [];

        const schemas = await Promise.all(
          recommended.map(async (item: any) => {
            let icons: ProviderInfo[] = [];
            let schemaCode: string | null = null;

            try {
              const fullPage = await fetchUmbracoContent(
                item.route?.path,
                contentLocale,
              );
              schemaCode = fullPage.properties?.schemaCode || null;
              const resolvedRefs = await resolveBlockReferences(
                fullPage.properties?.providers,
                contentLocale,
              );
              icons = resolvedRefs.map((ref: any) => {
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
            } catch {
              /* show schema without icons */
            }

            const displayName = schemaCode
              ? `${item.name} (${schemaCode})`
              : item.name;
            const andMoreText =
              icons.length > 1 ? `+ ${t("start.more", locale)}` : undefined;
            return {
              pageName: displayName,
              url: item.route?.path,
              providerIcons: icons,
              andMoreText,
              componentName: "RecommendedSchema",
            };
          }),
        );

        relevantSchemas = {
          componentName: "RelevantSchemasBlock",
          relevantSchemasHeader: t("schemaOverview.recommendedSchemas", locale),
          showAllSchemasText: t("start.allSchemasAndServices", locale),
          schemaOverviewPageUrl: schemaRef.route.path,
          schemas,
        };
      } catch {
        /* no schemas section */
      }
    }

    // --- Company / "Starte og drive" section ---
    const companyRef = p.startAndRunCompany?.[0];
    const companyTitle = companyRef ? t("start.companyTitle", locale) : null;
    const companyText = companyRef ? t("start.companyText", locale) : null;

    // --- News list (fetch each article for mainIntro + lastChanged) ---
    const newsRefs: any[] = p.latestNewsContentArea ?? [];
    const newsList = await Promise.all(
      newsRefs.map(async (ref: any) => {
        let full: any = null;
        try {
          full = await fetchUmbracoContent(ref.route?.path, contentLocale);
        } catch {
          /* fall back to ref-level fields below */
        }
        const dateRaw =
          full?.properties?.lastChanged ?? ref.updateDate ?? "";
        return {
          componentName: "NewsArticleItem",
          pageName: ref.name ?? "",
          mainIntro: full?.properties?.mainIntro ?? "",
          url: ref.route?.path ?? "",
          lastChanged: formatDate(dateRaw),
        };
      }),
    );

    // --- News archive ---
    const newsArchiveRef = p.newsArchiveLocation?.[0];

    return {
      componentName: "StartPage",
      pageName: cmsPageData.name,

      // Search
      searchPageUrl: p.searchPage?.[0]?.route?.path || "/sok/",
      searchPlaceholder: t("start.searchPlaceholder", locale),
      searchAriaLabel: t("start.searchAriaLabel", locale),
      searchContentText: p.searchContentText || null,

      // Omitted rarely-used features
      isUserLoggedIn: false,
      login: null,
      alternateLogin: null,
      criticalOperationalMessages,
      operationalMessages,

      // Relevant schemas
      relevantSchemas,

      // Company / "Starte og drive" section
      companyTitle,
      companyText,
      companyImageUrl:
        "/assets/img/illustrasjon_regnskap_og_revisjon_sirkel.svg",
      companyImageAlt: "",

      // Block areas
      promoBoxArea,
      linkButtonAreaTitle:
        p.linkButtonAreaText || t("start.linkButtonAreaTitle", locale),
      linkButtonArea,

      // Hero image
      topImageUrl: "/assets/img/illustrasjon_hjelp_sirkel_1.svg",

      // News
      latestNewsHeading: p.latestNewsHeading || t("start.latestNews", locale),
      newsList,
      newsArchiveUrl: newsArchiveRef?.route?.path || "/nyheter/",
      showArchiveText: t("start.showArchive", locale),

      // Campaign (omitted if empty)
      campaginArea: null,
    };
  }
}
