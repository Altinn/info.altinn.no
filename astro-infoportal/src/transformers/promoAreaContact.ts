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
  // Shared blocks (editor label "Delt blokk") live under the `delte-blokker`
  // root and are published as their own content type. The property shape is
  // identical to formElementContactFreetext, so mapContactBlock handles both.
  "providerContactInformationBlock",
]);

/**
 * Content type of the "Delt blokk" wrapper element, and the alias of the
 * Content Picker property it holds. The wrapper carries no renderable content
 * of its own — only references to shared blocks under the `delte-blokker` root.
 */
const SHARED_BLOCK_WRAPPER_TYPE = "blockPicker";
const SHARED_BLOCK_PICKER_ALIAS = "blockPicker";

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
 * Expands "Delt blokk" wrappers into the shared blocks they point at (issue #690).
 *
 * The Delivery API returns the wrapper as
 * `{ contentType: "blockPicker", properties: { blockPicker: [ref, …] } }`,
 * where each ref carries only `id`/`route` and an empty `properties` object.
 * Nothing downstream knows the `blockPicker` alias, so an unexpanded wrapper
 * renders as nothing at all. Resolve each ref and splice the resolved content
 * in as if the editor had authored it inline; refs that cannot be resolved
 * (unpublished or deleted) are dropped rather than rendered empty.
 *
 * Blocks that are not wrappers pass through untouched, so this is a no-op —
 * and costs no requests — for promoAreas authored entirely inline.
 */
export async function expandSharedBlocks(
  promoArea: any,
  resolveSharedBlock: (ref: any) => Promise<any>,
): Promise<any> {
  const items = promoAreaItems(promoArea);
  if (!items.some(isSharedBlockWrapper)) return promoArea;

  const expanded = await Promise.all(
    items.map(async (wrapper) => {
      if (!isSharedBlockWrapper(wrapper)) return [wrapper];
      const content = wrapper?.content ?? wrapper;
      const refs = content?.properties?.[SHARED_BLOCK_PICKER_ALIAS];
      if (!Array.isArray(refs)) return [];
      const resolved = await Promise.all(refs.map(resolveSharedBlock));
      return resolved.filter(Boolean).map((block) => ({ content: block }));
    }),
  );

  return { ...(promoArea ?? {}), items: expanded.flat() };
}

function isSharedBlockWrapper(wrapper: any): boolean {
  const content = wrapper?.content ?? wrapper;
  return content?.contentType === SHARED_BLOCK_WRAPPER_TYPE;
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
