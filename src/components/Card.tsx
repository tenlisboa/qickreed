import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  shadow?: "sm" | "md" | "lg";
  padding?: "sm" | "md" | "lg";
}

export default function Card({
  children,
  className = "",
  shadow = "lg",
  padding = "md",
}: CardProps) {
  const baseClasses = "card bg-white border border-gray-200";

  const shadowClasses = {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div className={`${baseClasses} ${shadowClasses[shadow]} ${className}`}>
      <div className={`card-body ${paddingClasses[padding]}`}>{children}</div>
    </div>
  );
}
