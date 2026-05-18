import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "tertiary";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function WiseButton({
  variant = "primary",
  full,
  leftIcon,
  rightIcon,
  className = "",
  children,
  ...rest
}: Props) {
  const cls =
    variant === "primary" ? "btn-primary" : variant === "secondary" ? "btn-secondary" : "btn-tertiary";
  return (
    <button {...rest} className={`${cls} ${full ? "w-full" : ""} ${className}`}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
