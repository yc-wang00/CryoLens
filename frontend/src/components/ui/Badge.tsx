import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] leading-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-white/80 text-muted-foreground",
        accent: "border-transparent bg-accent text-accent-foreground",
        muted: "border-border/40 bg-muted text-muted-foreground",
        highlight: "border-transparent bg-highlight-muted text-highlight",
        data: "border-transparent bg-muted font-mono text-foreground tracking-normal normal-case",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({
  className,
  variant,
  ...props
}: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
