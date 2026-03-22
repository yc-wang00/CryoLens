import {
  Bell,
  CircleHelp,
  BookOpenText,
  ExternalLink,
  FlaskConical,
  LayoutGrid,
  Lightbulb,
  LogOut,
  Search,
  Settings,
  TestTubeDiagonal,
  UserCircle2,
} from "lucide-react";
import { useState, type ReactNode } from "react";

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

const navItems: Array<{
  key: PageKey;
  label: string;
  icon: typeof Search;
}> = [
  { key: "ask", label: "Search", icon: Search },
  { key: "hypotheses", label: "Experiments", icon: Lightbulb },
  { key: "molecules", label: "Library", icon: FlaskConical },
  { key: "cocktails", label: "Cocktails", icon: TestTubeDiagonal },
  { key: "sources", label: "Sources", icon: BookOpenText },
];

export function AppShell({
  currentPage,
  dataSource,
  dataSourceLabel,
  onPageChange,
  children,
}: AppShellProps) {
  const [shellModal, setShellModal] = useState<"none" | "account" | "docs" | "support">("none");

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <header className="glass-panel fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-slate-50/90">
        <div className="flex h-14 items-center justify-between px-5 lg:px-6">
          <div className="font-headline text-[1.02rem] font-extrabold tracking-tight text-hero">
            CryoLens
          </div>
          <div className="hidden items-center gap-6 lg:flex">
            <button
              className={cn(
                "border-b px-0 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                currentPage === "ask" ? "border-hero text-hero" : "border-transparent text-muted-foreground",
              )}
              onClick={() => onPageChange("ask")}
              type="button"
            >
              Search
            </button>
            <button
              className={cn(
                "border-b px-0 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                currentPage === "hypotheses"
                  ? "border-hero text-hero"
                  : "border-transparent text-muted-foreground",
              )}
              onClick={() => onPageChange("hypotheses")}
              type="button"
            >
              Experiments
            </button>
            <button
              className={cn(
                "border-b px-0 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                currentPage === "sources"
                  ? "border-hero text-hero"
                  : "border-transparent text-muted-foreground",
              )}
              onClick={() => onPageChange("sources")}
              type="button"
            >
              Sources
            </button>
          </div>
          <div className="hidden items-center gap-4 xl:flex">
            {dataSource ? (
              <div
                className={cn(
                  "rounded-sm border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                  dataSource === "live"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
                title={dataSourceLabel}
              >
                {dataSource === "live" ? "Live data" : "Mock fallback"}
              </div>
            ) : null}
            <button className="text-muted-foreground transition-colors hover:text-foreground" type="button">
              <Bell className="h-4 w-4" />
            </button>
            <button className="text-muted-foreground transition-colors hover:text-foreground" type="button">
              <Settings className="h-4 w-4" />
            </button>
            <button
              aria-label="Open account"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-highlight text-white transition-transform hover:scale-[1.03]"
              onClick={() => setShellModal("account")}
              type="button"
            >
              <UserCircle2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <aside className="fixed left-0 top-14 hidden h-[calc(100vh-3.5rem)] w-56 flex-col border-r border-border/60 bg-panel/80 p-5 lg:flex">
        <div className="border-b border-border/70 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div>
              <div className="font-headline text-sm font-extrabold text-hero">CryoLens</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                knowledge engine
              </div>
            </div>
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

        <div className="mt-auto space-y-5 pt-10 text-[11px] text-muted-foreground">
          <button
            className="flex items-center gap-2 px-2 font-semibold uppercase tracking-[0.14em] transition-colors hover:text-foreground"
            onClick={() => setShellModal("docs")}
            type="button"
          >
            <BookOpenText className="h-3.5 w-3.5" />
            Documentation
          </button>
          <button
            className="flex items-center gap-2 px-2 font-semibold uppercase tracking-[0.14em] transition-colors hover:text-foreground"
            onClick={() => setShellModal("support")}
            type="button"
          >
            <CircleHelp className="h-3.5 w-3.5" />
            Support
          </button>
        </div>
      </aside>

      <main className="px-4 pb-8 pt-20 lg:ml-56 lg:px-6">
        <div className="grid-lines min-h-[calc(100vh-6rem)] rounded-md border border-border/40 bg-white/55 p-4 sm:p-5 lg:p-6">
          {children}
        </div>
      </main>

      <Dialog onOpenChange={(open) => (!open ? setShellModal("none") : null)} open={shellModal !== "none"}>
        <DialogContent className="max-w-xl" onClose={() => setShellModal("none")}>
          {shellModal === "account" ? (
            <>
              <DialogHeader>
                <DialogTitle>Account</DialogTitle>
                <DialogDescription>
                  Local demo profile for the CryoLens operator workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-5">
                <div className="rounded-sm border border-border bg-white/80 p-4">
                  <p className="table-header">Signed in as</p>
                  <p className="mt-2 font-headline text-lg font-extrabold tracking-tight text-hero">
                    Kenji Demo
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    CryoLens research operator · local mock session
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
                    Use the seeded prompts in Search, inspect evidence through modals, and switch to
                    Experiments to save the next step. This build is mock-data only.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    className="inline-flex h-10 items-center justify-between rounded-sm border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    href="mailto:demo@cryosight.local?subject=CryoLens%20Hackathon%20Demo"
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
