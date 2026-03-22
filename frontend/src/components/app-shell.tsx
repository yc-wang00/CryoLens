/**
 * APP SHELL
 * =========
 * Shared route chrome for the CryoSight frontend.
 *
 * KEY CONCEPTS:
 * - Desktop uses a single primary navigation rail.
 * - Mobile keeps navigation behind a lightweight slide-over.
 *
 * USAGE:
 * - Wrap page content in `AppShell` and pass the active page key.
 *
 * MEMORY REFERENCES:
 * - MEM-0004
 * - MEM-0005
 * - MEM-0009
 */

import {
  BookOpenText,
  CircleHelp,
  ExternalLink,
  FlaskConical,
  LayoutGrid,
  Lightbulb,
  LogOut,
  Menu,
  Search,
  TestTubeDiagonal,
  UserCircle2,
  X,
} from "lucide-react";
import { useState, type JSX, type ReactNode } from "react";

import type { PageKey } from "../data/mock-data";
import { cn } from "../lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface AppShellProps {
  currentPage: PageKey;
  dataSource?: "live" | "mock";
  dataSourceLabel?: string;
  onPageChange: (page: PageKey) => void;
  children: ReactNode;
}

interface SidebarContentProps {
  currentPage: PageKey;
  dataSource?: "live" | "mock";
  dataSourceLabel?: string;
  onAccountOpen: () => void;
  onDocsOpen: () => void;
  onPageChange: (page: PageKey) => void;
  onSupportOpen: () => void;
}

const navItems: Array<{
  key: PageKey;
  label: string;
  icon: typeof Search;
}> = [
  { key: "ask", label: "Research", icon: Search },
  { key: "hypotheses", label: "Hypotheses", icon: Lightbulb },
  { key: "molecules", label: "Library", icon: FlaskConical },
  { key: "cocktails", label: "Cocktails", icon: TestTubeDiagonal },
  { key: "sources", label: "Sources", icon: BookOpenText },
];

function DataSourceBadge({
  dataSource,
  dataSourceLabel,
}: Pick<SidebarContentProps, "dataSource" | "dataSourceLabel">): JSX.Element | null {
  if (!dataSource) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
        dataSource === "live"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-800",
      )}
      title={dataSourceLabel}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dataSource === "live" ? "bg-emerald-500" : "bg-amber-500")} />
      {dataSource === "live" ? "Live data" : "Mock fallback"}
    </div>
  );
}

function SidebarContent({
  currentPage,
  dataSource,
  dataSourceLabel,
  onAccountOpen,
  onDocsOpen,
  onPageChange,
  onSupportOpen,
}: SidebarContentProps): JSX.Element {
  return (
    <>
      <div className="border-b border-border/70 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-headline text-sm font-extrabold text-hero">CryoSight</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              knowledge engine
            </div>
          </div>
        </div>
        <div className="mt-4">
          <DataSourceBadge dataSource={dataSource} dataSourceLabel={dataSourceLabel} />
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Research engine
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={cn(
                  "flex w-full items-center gap-3 rounded-sm px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
                  currentPage === item.key
                    ? "bg-white text-hero shadow-sm"
                    : "text-muted-foreground hover:bg-slate-200/60 hover:text-foreground",
                )}
                onClick={() => onPageChange(item.key)}
                type="button"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-10">
        <button
          className="flex w-full items-center gap-3 rounded-sm border border-border/80 bg-white px-3 py-3 text-left transition-colors hover:bg-muted"
          onClick={onAccountOpen}
          type="button"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b8b699] text-white">
            <UserCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-hero">Kenji Demo</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              local operator
            </div>
          </div>
        </button>
        <button
          className="flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
          onClick={onDocsOpen}
          type="button"
        >
          <BookOpenText className="h-3.5 w-3.5" />
          Documentation
        </button>
        <button
          className="flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
          onClick={onSupportOpen}
          type="button"
        >
          <CircleHelp className="h-3.5 w-3.5" />
          Support
        </button>
      </div>
    </>
  );
}

export function AppShell({
  currentPage,
  dataSource,
  dataSourceLabel,
  onPageChange,
  children,
}: AppShellProps): JSX.Element {
  const [shellModal, setShellModal] = useState<"none" | "account" | "docs" | "support">("none");
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  function handlePageChange(page: PageKey): void {
    onPageChange(page);
    setMobileNavOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-slate-50/92 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            aria-label="Open navigation"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-white text-hero transition-colors hover:bg-muted"
            onClick={() => setMobileNavOpen(true)}
            type="button"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="text-center">
            <div className="font-headline text-sm font-extrabold text-hero">CryoSight</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              knowledge engine
            </div>
          </div>
          <button
            aria-label="Open account"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b8b699] text-white transition-transform hover:scale-[1.03]"
            onClick={() => setShellModal("account")}
            type="button"
          >
            <UserCircle2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-[#1a2b3c]/18 transition-opacity lg:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileNavOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/60 bg-[#eef3f5] p-5 transition-transform lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-4 flex items-center justify-end lg:hidden">
          <button
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-white text-hero transition-colors hover:bg-muted"
            onClick={() => setMobileNavOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarContent
          currentPage={currentPage}
          dataSource={dataSource}
          dataSourceLabel={dataSourceLabel}
          onAccountOpen={() => setShellModal("account")}
          onDocsOpen={() => setShellModal("docs")}
          onPageChange={handlePageChange}
          onSupportOpen={() => setShellModal("support")}
        />
      </aside>

      <main className="min-h-screen px-4 pb-8 pt-4 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[1380px]">{children}</div>
      </main>

      <Dialog onOpenChange={(open) => (!open ? setShellModal("none") : null)} open={shellModal !== "none"}>
        <DialogContent className="max-w-xl" onClose={() => setShellModal("none")}>
          {shellModal === "account" ? (
            <>
              <DialogHeader>
                <DialogTitle>Account</DialogTitle>
                <DialogDescription>
                  Local demo profile for the CryoSight operator workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-5">
                <div className="rounded-sm border border-border bg-white/80 p-4">
                  <p className="table-header">Signed in as</p>
                  <p className="mt-2 font-headline text-lg font-extrabold tracking-tight text-hero">
                    Kenji Demo
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    CryoSight research operator · local mock session
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={() => setShellModal("docs")} variant="outline">
                    Open docs
                    <BookOpenText className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setShellModal("support")} variant="outline">
                    Get support
                    <CircleHelp className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full justify-between" variant="ghost">
                  Sign out
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : null}

          {shellModal === "docs" ? (
            <>
              <DialogHeader>
                <DialogTitle>Documentation</DialogTitle>
                <DialogDescription>
                  Quick links for the hackathon story, schema, and frontend contract.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 p-5">
                <a
                  className="flex items-center justify-between rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
                  href="/docs/specs/hackathon-ui-demo-spec.md"
                  rel="noreferrer"
                  target="_blank"
                >
                  Hackathon UI spec
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
                <a
                  className="flex items-center justify-between rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
                  href="/hero-story.md"
                  rel="noreferrer"
                  target="_blank"
                >
                  Hero story
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
                <a
                  className="flex items-center justify-between rounded-sm border border-border bg-white/80 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
                  href="/queries.md"
                  rel="noreferrer"
                  target="_blank"
                >
                  Demo queries
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            </>
          ) : null}

          {shellModal === "support" ? (
            <>
              <DialogHeader>
                <DialogTitle>Support</DialogTitle>
                <DialogDescription>
                  Minimal support actions for the local demo build.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-5">
                <div className="rounded-sm border border-border bg-white/80 p-4">
                  <p className="table-header">Need help with the demo?</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    Use Research for evidence-backed search, then switch to Hypotheses to review saved drafts and the supporting experiment registry.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    className="inline-flex h-10 items-center justify-between rounded-sm border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    href="mailto:demo@cryosight.local?subject=CryoSight%20Hackathon%20Demo"
                  >
                    Email support
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                  <Button onClick={() => setShellModal("docs")} variant="outline">
                    Open docs
                    <BookOpenText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
