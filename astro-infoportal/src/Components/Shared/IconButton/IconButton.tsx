import type { FocusEventHandler, MouseEventHandler } from "react";

import { ButtonBase } from "./ButtonBase";
import { ButtonIcon, type ButtonIconProps } from "./ButtonIcon";
import type { ButtonColor, ButtonSize, ButtonVariant } from "./types";

export interface IconButtonProps {
  icon: ButtonIconProps["icon"];
  iconAltText: string;
  color?: ButtonColor;
  size?: ButtonSize;
  iconSize?: ButtonSize;
  variant?: ButtonVariant;
  rounded?: boolean;
  selected?: boolean;
  className?: string;
  onClick?: MouseEventHandler;
  dataTestId?: string;
  onBlurCapture?: FocusEventHandler<HTMLButtonElement>;
  themeColor?: "accent" | "success" | "warning" | "danger" | "info";
}

export const IconButton = ({
  variant = "solid",
  rounded = false,
  size,
  icon,
  iconSize,
  iconAltText,
  color,
  className,
  selected,
  onClick,
  dataTestId,
  onBlurCapture,
  themeColor,
}: IconButtonProps) => {
  return (
    <ButtonBase
      variant={variant}
      rounded={rounded}
      color={color}
      size={size}
      className={className}
      onClick={onClick}
      selected={selected}
      data-testid={dataTestId}
      aria-label={iconAltText}
      onBlurCapture={onBlurCapture}
      themeColor={themeColor}
    >
      {icon && <ButtonIcon icon={icon} size={iconSize} />}
    </ButtonBase>
  );
};
