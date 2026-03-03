import cx from "classnames";
import type { ButtonHTMLAttributes, CSSProperties, ElementType, ReactNode } from "react";

import type { ButtonColor, ButtonSize, ButtonVariant } from "./types";
import * as styles from "./ButtonBase.module.scss";

interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Change the default rendered element for the one passed as a child, merging their props and behavior.
   * @default false
   */
  as?: ElementType;
  size?: ButtonSize;
  variant?: ButtonVariant;
  reverse?: boolean;
  rounded?: boolean;
  color?: ButtonColor;
  selected?: boolean;
  disabled?: boolean;
  href?: string;
  className?: string;
  children?: ReactNode;
  ariaLabel?: string;
  dataTestId?: string;
  themeColor?: "accent" | "success" | "warning" | "danger" | "info";
}

export const ButtonBase = ({
  as,
  color,
  className,
  children,
  disabled = false,
  ariaLabel,
  size,
  selected,
  variant,
  reverse = false,
  rounded = false,
  tabIndex = 0,
  dataTestId,
  themeColor,
  ...rest
}: ButtonBaseProps) => {
  const Component = as || "button";
  return (
    <Component
      tabIndex={tabIndex}
      data-size={size}
      data-color={color}
      data-variant={variant}
      data-reverse={reverse}
      data-rounded={rounded}
      data-selected={selected}
      data-theme-color={themeColor}
      aria-disabled={disabled}
      disabled={disabled}
      className={cx(styles.button, className)}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      style={
        themeColor
          ? ({
              "--dsc-button-background": "transparent",
              "--dsc-button-color": "var(--ds-color-base-contrast-default)",
            } as CSSProperties)
          : undefined
      }
      {...rest}
    >
      {children}
    </Component>
  );
};
