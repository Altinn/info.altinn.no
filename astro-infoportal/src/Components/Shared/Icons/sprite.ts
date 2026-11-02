import { spriteUrl } from "virtual:icon-sprite";

/** `<use href>` of a symbol in the icon sprite, e.g. spriteHref("ArrowRight"). */
export const spriteHref = (name: string, sprite = spriteUrl) =>
  `${sprite}#${name}`;
