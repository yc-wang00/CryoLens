import type { TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
      <textarea
      className={cn(
        "flex min-h-36 w-full rounded-sm border border-border bg-white px-4 py-3 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}
