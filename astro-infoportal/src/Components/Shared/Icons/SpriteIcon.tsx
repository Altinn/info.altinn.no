import { type SVGProps, useId } from "react";
import { spriteHref } from "./sprite";

export interface SpriteIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
  titleId?: string;
}

/**
 * Drop-in replacement for an `@navikt/aksel-icons` component that points at
 * the shared sprite instead of inlining the path. `name` is the aksel icon
 * name without the `Icon` suffix; the build adds it to the sprite. `sprite`
 * is only passed by resolveIcon, for icons from the full sprite.
 */
export const createSpriteIcon = (name: string, sprite?: string) => {
  const SpriteIcon = ({ title, titleId, ...props }: SpriteIconProps) => {
    const generatedId = useId();
    const labelId = title ? titleId || `title-${generatedId}` : undefined;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        fill="none"
        viewBox="0 0 24 24"
        focusable="false"
        role="img"
        aria-labelledby={labelId}
        {...props}
      >
        {title ? <title id={labelId}>{title}</title> : null}
        <use href={spriteHref(name, sprite)} />
      </svg>
    );
  };
  SpriteIcon.displayName = `${name}Icon`;
  return SpriteIcon;
};
