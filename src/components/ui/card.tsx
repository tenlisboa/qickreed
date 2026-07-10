import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-base border-[3px] border-black bg-white text-black",
  {
    variants: {
      variant: {
        default: "",
      },
      shadow: {
        none: "",
        sm: "shadow-brutal-sm",
        md: "shadow-brutal",
        lg: "shadow-brutal-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      shadow: "md",
    },
  },
);

export type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, shadow, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, shadow }), "p-4", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-2", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-2xl font-bold", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardContent, cardVariants };
