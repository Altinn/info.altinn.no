import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors, fetchUmbracoChildren, fetchUmbracoContent } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { BlockTransformer } from "./BlockTransformer";

export class ProviderPageTransformer implements IJSONTransformer {
  private static normalize(name: string): string {
    return name.replace(/\s*\(.*?\)\s*/g, "").trim().toLowerCase();
  }

  public async Transform(cmsPageData: any): Promise<any> {
    const props = cmsPageData.properties ?? {};

    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    // --- Org icons from altinn CDN ---
    const orgIconByName: Record<string, string> = {};
    try {
      const orgsRes = await fetch("https://altinncdn.no/orgs/altinn-orgs.json");
      const orgsData = await orgsRes.json() as { orgs: Record<string, { name?: { nb?: string }; logo?: string }> };
      for (const org of Object.values(orgsData.orgs)) {
        const nb = org.name?.nb;
        const logo = org.logo;
        if (nb && logo) {
          orgIconByName[nb.trim().toLowerCase()] = logo;
          orgIconByName[ProviderPageTransformer.normalize(nb)] = logo;
        }
      }
    } catch {
      // If CDN fetch fails, icons will be empty strings
    }

    const resolveIcon = (name: string): string => {
      const lower = name.trim().toLowerCase();
      return orgIconByName[lower] || orgIconByName[ProviderPageTransformer.normalize(name)] || "";
    };

    // --- Provider icon for the page header ---
    const providerIcon = {
      name: cmsPageData.name,
      imageUrl: resolveIcon(cmsPageData.name),
      type: "company" as const,
    };

    // --- Build provider lookup by importId for resolving additional providers on schemas ---
    const allProviders = await fetchUmbracoChildren("skjemaoversikt");
    const providerByImportId: Record<string, { name: string; imageUrl: string; url: string }> = {};
    for (const p of allProviders) {
      if (p.contentType !== "providerPage") continue;
      const info = {
        name: p.name,
        imageUrl: resolveIcon(p.name),
        url: p.route?.path || "",
      };
      if (p.properties?.importId != null) {
        providerByImportId[String(p.properties.importId)] = info;
      }
    }

    // --- Schema children of this provider ---
    const children = await fetchUmbracoChildren(cmsPageData.route.path);
    const schemas = children
      .filter((c: any) => c.contentType === "schemaPage")
      .map((schema: any) => {
        const providers: { name: string; imageUrl: string; url: string }[] = [];

        // Parent provider is always the first provider
        providers.push({
          name: cmsPageData.name,
          imageUrl: providerIcon.imageUrl,
          url: cmsPageData.route?.path || "",
        });

        // Additional providers from comma-separated importId string
        const providersStr = schema.properties?.providers;
        if (typeof providersStr === "string" && providersStr.trim()) {
          for (const id of providersStr.split(",")) {
            const trimmed = id.trim();
            if (trimmed && providerByImportId[trimmed]) {
              // Avoid duplicating the parent provider
              const resolved = providerByImportId[trimmed];
              if (resolved.name !== cmsPageData.name) {
                providers.push(resolved);
              }
            }
          }
        }

        const schemaCode = schema.properties?.schemaCode;
        return {
          id: schema.properties?.importId ?? schema.id,
          title: schemaCode ? `${schema.name} (${schemaCode})` : schema.name,
          url: schema.route?.path,
          providers,
        };
      })
      .sort((a: any, b: any) => a.title.localeCompare(b.title, "nb"));

    // --- Contact info from providerContactInformationBlock in promoArea ---
    let contactInfo: any = undefined;
    const contactBlock = (props.promoArea || []).find(
      (b: any) => b.contentType === "providerContactInformationBlock",
    );
    if (contactBlock?.route?.path) {
      try {
        const blockPath = contactBlock.route.path.replace(/^\/+/, "");
        const blockData = await fetchUmbracoContent(blockPath);
        const bp = blockData.properties ?? {};
        contactInfo = {
          componentName: "ProviderContactInformationBlock",
          body: bp.body ?? undefined,
          bottomText: bp.bottomText ?? undefined,
          webpageLink: bp.webpageLink ?? undefined,
          telephone: bp.telephone ?? "",
          telephoneLabel: bp.telephoneLabel ?? "",
          email: bp.email ?? "",
          emailTitle: bp.emailTitle ?? "",
          pageName: cmsPageData.name,
          providerIcon: {
            name: cmsPageData.name,
            imageUrl: providerIcon.imageUrl,
          },
        };
      } catch {
        // Block fetch failed, skip contact info
      }
    }

    // --- Sidebar ---
    const pageSidebarViewModel = {
      titleItem: {
        label: "Alle etater",
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









