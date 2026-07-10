import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as NBButton } from "@/components/ui/button";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  asChild?: boolean;
}

const variantMap = {
  primary: "default",
  secondary: "neutral",
  outline: "outline",
} as const;

const sizeMap = {
  sm: "sm",
  md: "default",
  lg: "lg",
} as const;

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  asChild,
  ...props
}: ButtonProps) {
  return (
    <NBButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={className}
      asChild={asChild}
      {...props}
    >
      {children}
    </NBButton>
  );
}
