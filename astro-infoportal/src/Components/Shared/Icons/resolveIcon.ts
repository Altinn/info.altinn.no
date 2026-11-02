import type { ComponentType, SVGProps } from "react";
import { akselIconNames, fullSpriteUrl } from "virtual:icon-sprite";
import * as SpriteIcons from "./icons";
import { createSpriteIcon } from "./SpriteIcon";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const akselNames = new Set(akselIconNames);
// One component per name, so re-renders don't remount the icon.
const fullSpriteIcons = new Map<string, IconComponent>();

/**
 * Resolves an aksel icon by its export name (e.g. "MenuGridIcon"), as icon
 * names come from transformers and free-text CMS fields. Icons in icons.ts use
 * the regular sprite; any other aksel icon uses the full sprite, which only
 * pages showing such an icon download. Unknown names resolve to undefined.
 */
export const resolveIcon = (iconName?: string): IconComponent | undefined => {
  if (!iconName) return undefined;
  const spriteIcon = (SpriteIcons as Record<string, IconComponent>)[iconName];
  if (spriteIcon) return spriteIcon;

  const name = iconName.replace(/Icon$/, "");
  if (name === iconName || !akselNames.has(name)) return undefined;

  let icon = fullSpriteIcons.get(name);
  if (!icon) {
    icon = createSpriteIcon(name, fullSpriteUrl);
    fullSpriteIcons.set(name, icon);
  }
  return icon;
};
