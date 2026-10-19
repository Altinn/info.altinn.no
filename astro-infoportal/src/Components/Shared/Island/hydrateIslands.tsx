import { hydrateRoot } from "react-dom/client";
import * as Components from "../../../App.Components";
import { ISLAND_TAG, type IslandEnv, IslandProviders } from "./Island";

const hydrated = new WeakSet<Element>();

/**
 * Hydrates every `<altinn-island>` rendered by `withIsland` on the server.
 * Called from SiteLayout, the one Astro island on the page, so the islands
 * share its bundle instead of needing a client entry of their own.
 */
export const hydrateIslands = () => {
  for (const element of document.querySelectorAll<HTMLElement>(ISLAND_TAG)) {
    if (hydrated.has(element)) continue;
    hydrated.add(element);
    const { name, props, env, prefix } = element.dataset;
    const Component = name
      ? (Components as Record<string, React.ComponentType<any>>)[name]
      : undefined;
    if (!Component) {
      console.error(`Island "${name}" not found in Components registry`);
      continue;
    }
    hydrateRoot(
      element,
      <IslandProviders env={JSON.parse(env || "{}") as IslandEnv}>
        <Component {...JSON.parse(props || "{}")} />
      </IslandProviders>,
      { identifierPrefix: prefix },
    );
  }
};
