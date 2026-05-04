import type { IJSONTransformer } from "./IJSONTransformer";
import { t, type Locale } from "@i18n/index";
import { fetchUmbracoContent, fetchUmbracoChildren } from "@api/umbraco/client";
import { buildOrgLookup, normalizeName, resolveProviderIcon } from "./providerUtils";
import { transformOperationalMessageArticle } from "./OperationalMessageArticlePageTransformer";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

function getParentProviderSlug(schemaPath?: string, overviewPath?: string): string | null {
  const schemaSegments = schemaPath?.split("/").filter(Boolean) ?? [];
  const overviewSegments = overviewPath?.split("/").filter(Boolean) ?? [];
  const providerSlug = schemaSegments[overviewSegments.length];
  return providerSlug || null;
}

type ProviderInfo = { name: string; imageUrl: string; url: string };
type ProviderLookup = Record<string, ProviderInfo>;

const PARENT_PROVIDER_FALLBACK_SLUGS: Record<string, string[]> = {
  "a-ordningen": [
    "skatteetaten",
    "arbeids-og-velferdsetaten-nav",
    "statistisk-sentralbyra",
    "a-ordningen",
  ],
  "the-a-ordning": [
    "tax-administration",
    "labour-and-welfare-service-nav",
    "statistics-norway-ssb",
    "the-a-ordning",
  ],
};

function addProviderOnce(providers: ProviderInfo[], provider?: ProviderInfo) {
  if (!provider) return;
  const exists = providers.some(
    (p) => p.url === provider.url || normalizeName(p.name) === normalizeName(provider.name),
  );
  if (!exists) providers.push(provider);
}

function addProvidersBySlug(
  providers: ProviderInfo[],
  providerBySlug: ProviderLookup,
  slugs: string[],
) {
  for (const slug of slugs) {
    addProviderOnce(providers, providerBySlug[slug]);
  }
}

export class StartPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const locale: Locale = globalData?.locale || "nb";
    const p = cmsPageData.properties ?? {};

    // --- Operational messages from AlertArea ---
    const alertRefs: any[] = p.alertArea ?? [];
    const alertMessages = (
      await Promise.all(
        alertRefs.map(async (ref: any) => {
          const route = ref.route?.path;
          if (!route) return null;
          try {
            const full = await fetchUmbracoContent(route, locale);
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
      (message: any) => !message.isCritical && message.colorVariant !== "danger",
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
        link: { text: t("start.findSchema", locale), url: schemaRef.route?.path || "/skjemaoversikt/" },
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
        const full = await fetchUmbracoContent(route, locale);
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
        const schemaPage = await fetchUmbracoContent(schemaRef.route.path, locale);
        const recommended = schemaPage.properties?.recommendedSchemas ?? [];

        // Build org icon lookup
        let orgLookup = buildOrgLookup({});
        try {
          const orgsRes = await fetch("https://altinncdn.no/orgs/altinn-orgs.json");
          const orgsData = await orgsRes.json() as { orgs: Record<string, { name?: Record<string, string>; logo?: string }> };
          orgLookup = buildOrgLookup(orgsData.orgs);
        } catch { /* icons will be empty */ }

        // Build provider lookup from schemaOverviewPage children
        const rawProviders = await fetchUmbracoChildren(schemaRef.route.path, 100, locale);
        const providers = await Promise.all(
          rawProviders.map(async (provider: any) => {
            const path = provider.route?.path;
            if (!path) return provider;
            try {
              return await fetchUmbracoContent(path, locale);
            } catch {
              return provider;
            }
          }),
        );
        const providerBySlug: ProviderLookup = {};
        const providerByImportId: ProviderLookup = {};
        for (const prov of providers) {
          const info = {
            name: prov.name,
            imageUrl: resolveProviderIcon(prov, orgLookup),
            url: prov.route?.path || "",
          };
          const slug = prov.route?.path?.split("/").filter(Boolean).pop();
          if (slug) providerBySlug[slug] = info;
          const providerId = prov.properties?.providerId ?? prov.properties?.importId;
          if (providerId != null) providerByImportId[String(providerId)] = info;
        }

        const schemas = await Promise.all(
          recommended.map(async (item: any) => {
            const icons: ProviderInfo[] = [];
            let schemaCode: string | null = null;
            const parentSlug = getParentProviderSlug(
              item.route?.path,
              schemaRef.route.path,
            );

            try {
              const fullPage = await fetchUmbracoContent(item.route?.path, locale);
              schemaCode = fullPage.properties?.schemaCode || null;

              const providersStr = fullPage.properties?.providers;
              if (typeof providersStr === "string" && providersStr.trim()) {
                for (const id of providersStr.split(",")) {
                  const trimmed = id.trim();
                  if (trimmed) addProviderOnce(icons, providerByImportId[trimmed]);
                }
              }
            } catch { /* show schema without icons */ }

            if (icons.length === 0 && parentSlug) {
              addProvidersBySlug(
                icons,
                providerBySlug,
                PARENT_PROVIDER_FALLBACK_SLUGS[parentSlug] ?? [parentSlug],
              );
            }

            const displayName = schemaCode ? `${item.name} (${schemaCode})` : item.name;
            const andMoreText = icons.length > 1 ? `+ ${t("start.more", locale)}` : undefined;
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
      } catch { /* no schemas section */ }
    }

    // --- Company / "Starte og drive" section ---
    const companyRef = p.startAndRunCompany?.[0];
    const companyTitle = companyRef
      ? t("start.companyTitle", locale)
      : null;
    const companyText = companyRef
      ? t("start.companyText", locale)
      : null;

    // --- News list (fetch each article for mainIntro) ---
    const newsRefs: any[] = p.latestNewsContentArea ?? [];
    const newsList = await Promise.all(
      newsRefs.map(async (ref: any) => {
        let mainIntro = "";
        try {
          const full = await fetchUmbracoContent(ref.route?.path, locale);
          mainIntro = full.properties?.mainIntro ?? "";
        } catch { /* no intro */ }
        return {
          componentName: "NewsArticleItem",
          pageName: ref.name ?? "",
          mainIntro,
          url: ref.route?.path ?? "",
          lastChanged: formatDate(ref.updateDate ?? ""),
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
      companyImageUrl: "/assets/img/illustrasjon_regnskap_og_revisjon_sirkel.svg",
      companyImageAlt: "",

      // Block areas
      promoBoxArea,
      linkButtonAreaTitle: p.linkButtonAreaText || t("start.linkButtonAreaTitle", locale),
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
