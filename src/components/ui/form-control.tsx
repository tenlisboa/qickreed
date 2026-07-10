import * as React from "react";
import { cn } from "@/lib/utils";

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props} />
));
FormControl.displayName = "FormControl";

export { FormControl };
