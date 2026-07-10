import * as React from "react";
import { cn } from "@/lib/utils";

export type SpinnerProps = React.HTMLAttributes<HTMLSpanElement> & {
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        "inline-block animate-spin rounded-none border-[3px] border-black border-r-transparent align-[-0.125em]",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Spinner.displayName = "Spinner";

export { Spinner };
