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
  sidebarWidth = "w-72",
}: LayoutProps) {
  const sidebarSide = sidebarPosition === "right" ? "right-0 border-l" : "left-0 border-r";
  const mainPad = sidebar
    ? sidebarPosition === "right" ? "mr-72" : "ml-56"
    : "";

  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      {sidebar && (
        <aside
          className={`fixed ${sidebarSide} top-12 bottom-0 ${sidebarWidth} border-outline-variant/12 bg-surface-low/50 overflow-y-auto custom-scrollbar z-40`}
        >
          {sidebar}
        </aside>
      )}
      <main className={`pt-12 ${mainPad} min-h-screen`}>
        {children}
      </main>
    </div>
  );
}
