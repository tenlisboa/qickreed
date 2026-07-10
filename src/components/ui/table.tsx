import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn(
      "w-full caption-bottom border-collapse border-[3px] border-black bg-white text-black",
      className,
    )}
    {...props}
  />
));
Table.displayName = "Table";

const THead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("border-b-[3px] border-black bg-white font-bold", className)}
    {...props}
  />
));
THead.displayName = "THead";

const TBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn(className)} {...props} />
));
TBody.displayName = "TBody";

const TR = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn("border-b-[3px] border-black last:border-b-0", className)}
    {...props}
  />
));
TR.displayName = "TR";

const TH = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "border-[3px] border-black px-4 py-2 text-left font-bold",
      className,
    )}
    {...props}
  />
));
TH.displayName = "TH";

const TD = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("border-[3px] border-black px-4 py-2", className)}
    {...props}
  />
));
TD.displayName = "TD";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-2 text-sm font-bold text-black", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export { Table, THead, TBody, TR, TH, TD, TableCaption };
