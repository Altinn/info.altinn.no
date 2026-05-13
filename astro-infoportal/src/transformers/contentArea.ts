import { fetchUmbracoContent } from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import type { Locale } from "@i18n/index";

export async function hydrateContentAreaItems(items: any, locale: Locale) {
  if (!Array.isArray(items)) {
    return undefined;
  }

  const hydrated = await Promise.all(
    items.map(async (item: any) => {
      if (!item?.route?.path && !item?.id) {
        return item;
      }
      try {
        return await fetchUmbracoContent(item.id ?? item.route.path, locale);
      } catch {
        return item;
      }
    }),
  );

  return BlockTransformer.TransformBlocks(hydrated);
}
