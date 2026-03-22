/**
 * ASK TOOL UI
 * ===========
 * Lightweight local adaptation of the AI Elements Tool component pattern for
 * rendering streamed MCP/tool activity inside the Ask page.
 *
 * KEY CONCEPTS:
 * - collapsible tool cards
 * - explicit pending/running/completed/error states
 * - formatted input/output panels that fit the existing CryoSight design
 *
 * USAGE:
 * - import into the Ask page and map streamed tool call state into these parts
 */

import { AlertCircle, CheckCircle2, ChevronRight, LoaderCircle, Wrench } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";

import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

type ToolState = "input-streaming" | "input-available" | "output-available" | "output-error";

export function Tool({
  className,
  defaultOpen = false,
  ...props
}: Omit<ComponentProps<"details">, "open"> & {
  defaultOpen?: boolean;
}): ReactNode {
  return (
    <details
      className={cn("group overflow-hidden rounded-xl border border-border/70 bg-white/96", className)}
      open={defaultOpen}
      {...props}
    />
  );
}

export function ToolHeader({
  className,
  state,
  title,
  type,
  ...props
}: HTMLAttributes<HTMLElement> & {
  title?: string;
  type: string;
  state: ToolState;
}): ReactNode {
  const label = title ?? deriveToolName(type);

  return (
    <summary
      className={cn(
        "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-full border border-border/70 bg-[#f8fbfc] p-2 text-primary">
          <Wrench className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-hero">
            {label}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{formatToolState(state)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(state)}
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
      </div>
    </summary>
  );
}

export function ToolContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div
      className={cn("space-y-3 border-t border-border/70 px-4 py-4", className)}
      {...props}
    />
  );
}

export function ToolInput({
  className,
  input,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  input?: unknown;
}): ReactNode {
  return (
    <div
      className={cn("rounded-lg border border-border/70 bg-[#f8fbfc] px-3 py-3", className)}
      {...props}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Input
      </p>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-6 text-foreground">
        {formatToolPayload(input) || "Waiting for tool input..."}
      </pre>
    </div>
  );
}

export function ToolOutput({
  className,
  errorText,
  output,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  errorText?: string | null;
  output?: ReactNode;
}): ReactNode {
  const hasError = Boolean(errorText);

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-3",
        hasError
          ? "border-[#f0c7bf] bg-[#fdf3f1] text-[#8d4b3e]"
          : "border-border/70 bg-white text-foreground",
        className,
      )}
      {...props}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Output
      </p>
      <div className="mt-2 text-sm leading-6">
        {hasError ? (
          errorText
        ) : typeof output === "string" ? (
          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-6 text-foreground">
            {output}
          </pre>
        ) : (
          output ?? "Tool completed."
        )}
      </div>
    </div>
  );
}

function deriveToolName(type: string): string {
  return type.replace(/^tool-/, "").replace(/^mcp__/, "").replaceAll("__", " / ").replaceAll("_", " ");
}

function formatToolState(state: ToolState): string {
  switch (state) {
    case "input-streaming":
      return "Preparing input";
    case "input-available":
      return "Running";
    case "output-available":
      return "Completed";
    case "output-error":
      return "Error";
    default:
      return state;
  }
}

function formatToolPayload(input: unknown): string {
  if (!input) {
    return "";
  }

  if (typeof input === "string") {
    return input;
  }

  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

function getStatusBadge(state: ToolState): ReactNode {
  if (state === "output-available") {
    return (
      <Badge className="gap-1" variant="outline">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </Badge>
    );
  }

  if (state === "output-error") {
    return (
      <Badge className="gap-1" variant="outline">
        <AlertCircle className="h-3 w-3" />
        Error
      </Badge>
    );
  }

  return (
    <Badge className="gap-1" variant="outline">
      <LoaderCircle className="h-3 w-3 animate-spin" />
      {state === "input-streaming" ? "Pending" : "Running"}
    </Badge>
  );
}
