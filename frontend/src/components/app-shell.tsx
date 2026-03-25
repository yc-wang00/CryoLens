/**
 * APP SHELL
 * =========
 * Shared route chrome for the CryoLens frontend.
 *
 * Desktop uses a single primary navigation rail.
 * Mobile keeps navigation behind a lightweight slide-over.
 */

import {
  BookOpenText,
  FlaskConical,
  Github,
  Lightbulb,
  Menu,
  Search,
  TestTubeDiagonal,
  X,
} from "lucide-react";
import { useState, type JSX, type ReactNode } from "react";

import type { PageKey } from "../types";
import { cn } from "../lib/utils";

interface AppShellProps {
  currentPage: PageKey;
  onPageChange: (page: PageKey) => void;
  children: ReactNode;
}

interface SidebarContentProps {
  currentPage: PageKey;
  onPageChange: (page: PageKey) => void;
}

const navItems: Array<{
  key: PageKey;
  label: string;
  icon: typeof Search;
}> = [
  { key: "sources", label: "Knowledge Base", icon: BookOpenText },
  { key: "hypotheses", label: "Hypotheses", icon: Lightbulb },
  { key: "molecules", label: "Library", icon: FlaskConical },
  { key: "cocktails", label: "Cocktails", icon: TestTubeDiagonal },
  { key: "ask", label: "Research", icon: Search },
];

function SidebarContent({
  currentPage,
  onPageChange,
}: SidebarContentProps): JSX.Element {
  return (
    <>
      <div className="border-b border-border/70 pb-5">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="CryoLens" className="h-10 w-10" />
          <div className="min-w-0">
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

      <div className="mt-auto pt-10">
        <div className="rounded-sm border border-border/60 bg-white/60 px-4 py-3.5 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Defeating Entropy 2026
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Built by Yicheng Wang & Kenji Phang at the Defeating Entropy Hackathon, London.
          </p>
          <a
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-hero"
            href="https://github.com/yc-wang00/CryoLens"
            rel="noreferrer"
            target="_blank"
          >
            <Github className="h-3 w-3" />
            View source
          </a>
        </div>
      </div>
    </>
  );
}

export function AppShell({
  currentPage,
  onPageChange,
  children,
}: AppShellProps): JSX.Element {
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
            <div className="font-headline text-sm font-extrabold text-hero">CryoLens</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              knowledge engine
            </div>
          </div>
          <div className="w-9" />
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
          onPageChange={handlePageChange}
        />
      </aside>

      <main className="min-h-screen px-4 pb-8 pt-4 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[1380px]">{children}</div>
      </main>
    </div>
  );
}
