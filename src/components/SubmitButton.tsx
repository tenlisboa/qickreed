"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/components/Button";
import { Spinner } from "@/components/ui/spinner";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function SubmitButton({
  children,
  pendingLabel = "Aguarde…",
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending || disabled}
      {...props}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner size="sm" />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
