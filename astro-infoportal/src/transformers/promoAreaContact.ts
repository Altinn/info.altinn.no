// Shared handling for the `promoArea` Block List (editor label "Faglig
// brukerstøtte"). The contact blocks (`formElementContactFreetext` and the
// legacy `formElementContact`, which has no `heading` field) render as a
// ProviderContactInformationBlock. This logic is used identically by
// schemaPage, providerPage and schemaAttachmentPage so it lives here once.
//
// Localisation: the block is only authored on the NB content tree — EN/NN
// variants come back with `promoArea: null` (issue #365). Because the page
// itself exists in the requested locale, the whole-page NB fallback in
// `client.ts` never fires, so we fall back at the field level instead.

const CONTACT_BLOCK_TYPES = new Set([
  "formElementContactFreetext",
  "formElementContact",
]);

export function isContactBlock(contentType: string | undefined): boolean {
  return !!contentType && CONTACT_BLOCK_TYPES.has(contentType);
}

/** True when a promoArea value carries no renderable blocks. */
export function promoAreaIsEmpty(promoArea: any): boolean {
  if (!promoArea) return true;
  const items = Array.isArray(promoArea) ? promoArea : promoArea.items;
  return !Array.isArray(items) || items.length === 0;
}

export interface ContactHeadingFallback {
  name: string;
  imageUrl?: string;
}

/**
 * Maps one contact block's properties to a ProviderContactInformationBlock
 * view-model. An editor-supplied `heading` always wins. When it's absent and a
 * fallback (the provider) is given, the provider name + emblem are used instead
 * — matching the providerPage behaviour. schemaPage passes no fallback, so an
 * unset heading yields an empty title and no emblem.
 */
export function mapContactBlock(
  blockProps: any,
  fallback?: ContactHeadingFallback,
) {
  const heading = blockProps?.heading;
  return {
    componentName: "ProviderContactInformationBlock",
    body: blockProps?.body ?? undefined,
    bottomText: blockProps?.bottomText ?? undefined,
    webpageLink: blockProps?.webpageLink ?? undefined,
    telephone: blockProps?.telephone ?? "",
    telephoneLabel: blockProps?.telephoneLabel ?? "",
    email: blockProps?.email ?? "",
    emailTitle: blockProps?.emailTitle ?? "",
    pageName: heading || fallback?.name || "",
    providerIcon:
      !heading && fallback
        ? { name: fallback.name, imageUrl: fallback.imageUrl }
        : undefined,
  };
}

function promoAreaItems(promoArea: any): any[] {
  return Array.isArray(promoArea)
    ? promoArea
    : Array.isArray(promoArea?.items)
      ? promoArea.items
      : [];
}

/**
 * Builds the ContentArea view-model rendered by schemaPage / schemaAttachmentPage.
 * Contact blocks become a ProviderContactInformationBlock; every other block is
 * delegated to `transformOther` (the caller's BlockTransformer adapter). Returns
 * undefined when there's nothing to render.
 */
export function buildPromoAreaContentArea(
  promoArea: any,
  transformOther: (content: any) => any,
) {
  const items = promoAreaItems(promoArea)
    .map((wrapper) => {
      const content = wrapper?.content ?? wrapper;
      if (isContactBlock(content?.contentType)) {
        return mapContactBlock(content?.properties ?? {});
      }
      return transformOther(content);
    })
    .filter(Boolean);

  return items.length ? { componentName: "ContentArea", items } : undefined;
}

/**
 * Builds the single contactInfo view-model rendered in the providerPage header:
 * the first contact block, with the provider name + emblem as heading fallback.
 */
export function buildProviderContactInfo(
  promoArea: any,
  fallback: ContactHeadingFallback,
) {
  for (const wrapper of promoAreaItems(promoArea)) {
    const content = wrapper?.content ?? wrapper;
    if (isContactBlock(content?.contentType)) {
      return mapContactBlock(content?.properties ?? {}, fallback);
    }
  }
  return undefined;
}

/**
 * Field-level NB fallback for promoArea. When the localised value is empty and
 * we're not already on NB, fetch the NB node by id and use its promoArea. The
 * contact details (phone/email/links) are locale-independent; only the heading
 * and body text show in Norwegian — far better than the block disappearing.
 */
export async function resolvePromoAreaWithNbFallback(
  contentId: string | undefined,
  localizedPromoArea: any,
  contentLocale: string | undefined,
  fetchNbContentById: (id: string) => Promise<any>,
): Promise<any> {
  if (!promoAreaIsEmpty(localizedPromoArea)) return localizedPromoArea;
  if (!contentId || !contentLocale || contentLocale === "nb") {
    return localizedPromoArea;
  }
  const nb = await fetchNbContentById(contentId);
  return nb?.properties?.promoArea ?? localizedPromoArea;
}
