import type { ReactNode } from "react";
import { Card as NBCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  shadow?: "sm" | "md" | "lg";
  padding?: "sm" | "md" | "lg";
}

const shadowMap = {
  sm: "sm",
  md: "md",
  lg: "lg",
} as const;

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className = "",
  shadow = "lg",
  padding = "md",
}: CardProps) {
  return (
    <NBCard
      shadow={shadowMap[shadow]}
      className={cn(paddingClasses[padding], className)}
    >
      {children}
    </NBCard>
  );
}
