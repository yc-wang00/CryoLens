import type { ReactNode } from "react";
import { TopNav } from "./TopNav";

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: "left" | "right";
  sidebarWidth?: string;
}

export function Layout({
  children,
  sidebar,
  sidebarPosition = "right",
  sidebarWidth = "w-80",
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      {sidebar && (
        <aside
          className={`fixed ${sidebarPosition === "right" ? "right-0" : "left-0"} top-14 bottom-0 ${sidebarWidth} border-${sidebarPosition === "right" ? "l" : "r"} border-slate-200/50 bg-slate-100 flex flex-col overflow-y-auto custom-scrollbar z-40`}
        >
          {sidebar}
        </aside>
      )}
      <main
        className={`mt-14 min-h-screen ${sidebar && sidebarPosition === "right" ? "mr-80" : ""} ${sidebar && sidebarPosition === "left" ? "ml-64" : ""}`}
      >
        {children}
      </main>
    </div>
  );
}
