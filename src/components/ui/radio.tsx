import * as React from "react";
import { cn } from "@/lib/utils";

export type RadioProps = React.InputHTMLAttributes<HTMLInputElement>;

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, type = "radio", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-full border-[3px] border-black bg-white transition-brutal focus-brutal checked:bg-black disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Radio.displayName = "Radio";

export { Radio };
