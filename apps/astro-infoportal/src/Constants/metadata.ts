import type { Locale } from "@i18n/index";

export function buildMetadata(umbracoPageData: any, locale: Locale) {
  const p = umbracoPageData?.properties ?? {};
  const name = umbracoPageData?.name ?? "";

  const metaTitle = (p.metaTitle as string) || name;
  const title = metaTitle ? `Altinn - ${metaTitle}` : "Altinn";

  return {
    htmlLanguage: locale,
    title,
    metaDescription: (p.metaDescription as string) || "",
    metaKeywords: (p.metaKeywords as string) || "",
    canonicalUrl: (p.canonicalUrl as string) || "",
  };
}
