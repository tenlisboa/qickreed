import * as React from "react";
import { cn } from "@/lib/utils";

export type DividerProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: React.ReactNode;
};

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, label, ...props }, ref) => (
    <div ref={ref} className={cn("my-2", className)} {...props}>
      {label ? (
        <div className="flex items-center gap-2">
          <div className="h-[3px] flex-1 bg-black" />
          <span className="whitespace-nowrap text-sm font-bold text-black">
            {label}
          </span>
          <div className="h-[3px] flex-1 bg-black" />
        </div>
      ) : (
        <div className="h-[3px] w-full bg-black" />
      )}
    </div>
  ),
);
Divider.displayName = "Divider";

export { Divider };
