import * as React from "react";
import { cn } from "@/lib/utils";

const Join = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex [&>*]:focus-brutal [&>*+*]:-ml-[3px]",
      className,
    )}
    {...props}
  />
));
Join.displayName = "Join";

export { Join };
