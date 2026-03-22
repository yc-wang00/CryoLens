import { NavLink } from "react-router-dom";
import { Icon } from "../ui/Icon";

const navItems = [
  { to: "/ask", label: "Ask" },
  { to: "/hypotheses", label: "Hypotheses" },
  { to: "/molecules", label: "Molecules" },
  { to: "/sources", label: "Sources" },
];

export function TopNav() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-border h-14 flex items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <NavLink
          to="/"
          className="flex items-center gap-2.5"
        >
          <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
            <Icon name="ac_unit" className="text-white !text-[16px]" />
          </div>
          <span className="text-[15px] font-headline font-bold tracking-tight text-text-primary">
            CryoLens
          </span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-accent-subtle text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-muted"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary !text-[16px]"
          />
          <input
            className="bg-surface-muted border border-border focus:border-accent focus:ring-1 focus:ring-accent/20 text-[13px] w-56 pl-9 pr-3 py-2 rounded-md text-text-primary placeholder:text-text-tertiary outline-none transition-all"
            placeholder="Search..."
            type="text"
          />
        </div>
        <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-muted rounded-md transition-colors">
          <Icon name="settings" />
        </button>
      </div>
    </header>
  );
}
