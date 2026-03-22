import type { ReactNode } from "react";
import { TopNav } from "./TopNav";

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function Layout({ children, sidebar }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <div className="flex pt-14">
        <main className={`flex-1 ${sidebar ? "mr-80" : ""}`}>
          {children}
        </main>
        {sidebar && (
          <aside className="fixed right-0 top-14 bottom-0 w-80 border-l border-border bg-surface-muted overflow-y-auto custom-scrollbar">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
