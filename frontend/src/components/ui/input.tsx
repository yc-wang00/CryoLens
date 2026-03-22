import type { InputHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-sm border-x-0 border-t-0 border-b border-border bg-muted px-4 py-2 text-sm text-foreground shadow-none outline-none ring-0 placeholder:text-muted-foreground focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}
