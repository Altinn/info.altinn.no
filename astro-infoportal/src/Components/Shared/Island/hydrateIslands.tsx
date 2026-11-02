import type { ComponentType } from "react";
import { hydrateRoot } from "react-dom/client";
import * as Components from "../../../App.Components";
import { ISLAND_TAG, type IslandEnv, IslandProviders } from "./Island";

const hydrated = new WeakSet<Element>();

interface HydrateIslandsOptions {
  registry?: Record<string, ComponentType<any>>;
  root?: ParentNode;
  onRecoverableError?: (error: unknown) => void;
}

/**
 * Hydrates every `<altinn-island>` rendered by `withIsland` on the server.
 * Called from SiteLayout, the one Astro island on the page, so the islands
 * share its bundle instead of needing a client entry of their own.
 */
export const hydrateIslands = ({
  registry = Components as Record<string, ComponentType<any>>,
  root = document,
  onRecoverableError,
}: HydrateIslandsOptions = {}) => {
  for (const element of root.querySelectorAll<HTMLElement>(ISLAND_TAG)) {
    if (hydrated.has(element)) continue;
    hydrated.add(element);
    const { name, props, env, prefix } = element.dataset;
    const Component = name ? registry[name] : undefined;
    if (!Component) {
      console.error(`Island "${name}" not found in Components registry`);
      continue;
    }
    hydrateRoot(
      element,
      <IslandProviders env={JSON.parse(env || "{}") as IslandEnv}>
        <Component {...JSON.parse(props || "{}")} />
      </IslandProviders>,
      { identifierPrefix: prefix, onRecoverableError },
    );
  }
};
