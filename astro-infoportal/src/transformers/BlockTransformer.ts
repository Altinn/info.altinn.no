import { DoYouNeedHelpBlockTransformer } from "./DoYouNeedHelpBlockTransformer";
import type { IJSONTransformer } from "./IJSONTransformer";

/** Registry of block-level transformers keyed by Umbraco contentType alias. */
const blockTransformers: Record<string, IJSONTransformer> = {
  doYouNeedHelpBlock: new DoYouNeedHelpBlockTransformer(),
};

/**
 * Converts a Umbraco contentType alias (camelCase) to PascalCase component name.
 * e.g. "doYouNeedHelpBlock" → "DoYouNeedHelpBlock"
 */
function toPascalCase(alias: string): string {
  return alias.charAt(0).toUpperCase() + alias.slice(1);
}

export class BlockTransformer {
  /**
   * Transforms an Umbraco Block List / Block Grid value into a ContentAreaProps shape.
   *
   * Umbraco Block List format:
   * ```json
   * { "items": [ { "content": { "contentType": "…", "properties": {…} }, "settings": {…} } ] }
   * ```
   *
   * Returns: `{ componentName: "ContentArea", items: [ { componentName: "PascalName", ...props } ] }`
   */
  static TransformBlocks(umbracoBlocks: any): any {
    if (!umbracoBlocks) {
      return { componentName: "ContentArea", items: [] };
    }

    // Accept both `{ items: [...] }` and a raw array
    const rawItems: any[] = Array.isArray(umbracoBlocks)
      ? umbracoBlocks
      : Array.isArray(umbracoBlocks.items)
        ? umbracoBlocks.items
        : [];

    const mappedBlocks = rawItems.map((item) => {
      // Umbraco Block List wraps each entry in { content, settings }
      const content = item.content ?? item;
      const contentType: string = content.contentType ?? "";
      const properties = content.properties ?? {};

      // If a dedicated transformer exists, use it
      const transformer = blockTransformers[contentType];
      if (transformer) {
        return transformer.Transform({
          contentType,
          name: content.name ?? "",
          properties,
        });
      }

      // Fallback: spread properties and derive componentName from alias
      return {
        componentName: toPascalCase(contentType),
        ...properties,
      };
    });

    return {
      componentName: "ContentArea",
      items: mappedBlocks,
    };
  }
}
