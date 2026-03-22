import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import type {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from "react";

import { cn } from "../../lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent | globalThis.KeyboardEvent): void {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#f8f9fa]/78 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>,
    document.body,
  );
}

export function DialogContent({
  children,
  className,
  onClose,
  ...props
}: HTMLAttributes<HTMLDivElement> & { onClose: () => void }) {
  function handleContainerClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleContentKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      onClose();
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-6"
      onClick={handleContainerClick}
    >
      <div
        className={cn(
          "relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-md border border-border/80 bg-white shadow-[0_24px_60px_rgba(33,40,44,0.12)]",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleContentKeyDown}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        {...props}
      >
        <button
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-white text-muted-foreground transition-colors hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-border/60 bg-panel/60 p-5", className)} {...props} />;
}

export function DialogTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("font-headline text-lg font-semibold uppercase tracking-[0.08em] text-hero", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-2 pr-10 text-sm text-muted-foreground", className)} {...props} />;
}
