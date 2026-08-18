// Front-page driftsmeldinger — the `alertArea` picker on startPage.
//
// Umbraco's Delivery API omits picked references whose target has no published
// variant in the requested culture, so /nn/ and /en/ receive a truncated — often
// completely empty — alertArea even though the messages exist on NB. Editors
// expect an untranslated driftsmelding to still reach the localised front pages,
// rendered in bokmål, exactly as the old portal did (issue #672).
//
// The whole-page NB fallback in client.ts never helps here: the start page
// itself exists in every locale, so it never fires. Two field-level fallbacks
// are needed instead:
//   1. the reference list — NB's is the authoritative set of messages to show;
//   2. each message's content — resolved by id, so a translated variant wins and
//      NB is the fallback. A route-based fetch cannot express that: the NB route
//      /om-altinn/driftsmeldinger/… has no counterpart under /nn/, so it would
//      404 into NB and discard an existing nynorsk translation.

function refId(ref: any): string | undefined {
  return typeof ref?.id === "string" && ref.id ? ref.id : undefined;
}

/** Normalises the raw `alertArea` property value to an array of references. */
export function alertAreaRefs(alertArea: unknown): any[] {
  return Array.isArray(alertArea) ? alertArea : [];
}

/**
 * NB's list decides which driftsmeldinger the front page shows, and in which
 * order. References only the localised list carries are appended rather than
 * dropped — the property may be culture-variant, so a message an editor added
 * for one locale alone must survive. References without an id are unusable.
 */
export function mergeAlertRefs(nbRefs: any[], localizedRefs: any[]): any[] {
  const merged: any[] = [];
  const seen = new Set<string>();
  for (const ref of [...nbRefs, ...localizedRefs]) {
    const id = refId(ref);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push(ref);
  }
  return merged;
}

/**
 * Field-level NB fallback for the reference list. On NB — or without a node id
 * to look up — the localised list is already authoritative and no extra request
 * is made. If the NB lookup fails, the localised list is used as-is: a partial
 * front page beats a broken one.
 */
export async function resolveAlertRefsWithNbFallback(
  contentId: string | undefined,
  localizedAlertArea: unknown,
  contentLocale: string | undefined,
  fetchNbContentById: (id: string) => Promise<any>,
): Promise<any[]> {
  const localizedRefs = alertAreaRefs(localizedAlertArea);
  if (!contentId || !contentLocale || contentLocale === "nb") {
    return localizedRefs;
  }

  let nb: any = null;
  try {
    nb = await fetchNbContentById(contentId);
  } catch {
    return localizedRefs;
  }
  return mergeAlertRefs(
    alertAreaRefs(nb?.properties?.alertArea),
    localizedRefs,
  );
}

/**
 * Loads each referenced driftsmelding in the requested culture, preserving the
 * reference order. `fetchById` is expected to fall back to NB when the message
 * has no variant in that culture (what fetchUmbracoContentById does), so a
 * translated message renders localised and an untranslated one renders in
 * bokmål. Messages that fail to load are dropped instead of failing the page.
 */
export async function loadAlertMessages(
  refs: any[],
  fetchById: (id: string) => Promise<any>,
): Promise<any[]> {
  const loaded = await Promise.all(
    refs.map(async (ref) => {
      const id = refId(ref);
      if (!id) return null;
      try {
        return await fetchById(id);
      } catch {
        return null;
      }
    }),
  );
  return loaded.filter(Boolean);
}
