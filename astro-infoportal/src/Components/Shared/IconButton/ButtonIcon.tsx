import cx from "classnames";
import { type ReactNode, isValidElement } from "react";
import {
  Avatar,
  AvatarGroup,
  type AvatarGroupProps,
  type AvatarProps,
  Icon,
  type IconProps,
  type SvgElement,
  isAvatarGroupProps,
  isAvatarProps,
  isIconProps,
} from "@altinn/altinn-components";

import type { ButtonSize } from "./types";
import * as styles from "./ButtonIcon.module.scss";

export interface ButtonIconProps {
  icon?: IconProps | SvgElement | AvatarProps | AvatarGroupProps | ReactNode;
  iconAltText?: string;
  size?: ButtonSize;
  altText?: string;
  className?: string;
}

function isReactNode(value: unknown): value is ReactNode {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    isValidElement(value)
  );
}

export const ButtonIcon = ({ icon, size, className }: ButtonIconProps) => {
  return (
    <span className={cx(styles.wrapper, className)} data-size={size}>
      {(isAvatarProps(icon) && <Avatar {...icon} className={styles.avatar} />) ||
        (isAvatarGroupProps(icon) && <AvatarGroup {...icon} className={styles.avatarGroup} />) ||
        (isIconProps(icon) && <Icon {...(icon as IconProps)} className={styles.icon} />) ||
        (isReactNode(icon) && icon) || <Icon svgElement={icon as SvgElement} className={styles.icon} />}
    </span>
  );
};
