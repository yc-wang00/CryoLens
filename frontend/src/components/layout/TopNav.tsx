import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/ask", label: "Ask" },
  { to: "/hypotheses", label: "Hypotheses" },
  { to: "/molecules", label: "Molecules" },
  { to: "/sources", label: "Sources" },
];

export function TopNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl flex items-center justify-between px-8 h-14 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-8">
        <NavLink
          to="/"
          className="text-lg font-extrabold tracking-tighter text-[#1A2B3C] uppercase font-headline"
        >
          CryoLens
        </NavLink>
        <div className="hidden md:flex gap-6 items-center">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `font-headline tracking-[-0.02em] font-medium text-sm transition-all duration-200 active:scale-[0.98] ${
                  isActive
                    ? "text-[#1A2B3C] border-b border-[#1A2B3C] pb-1"
                    : "text-slate-500 hover:text-[#1A2B3C]"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-outline-variant text-sm">
            search
          </span>
          <input
            className="bg-surface-low border-none border-b border-outline-variant focus:border-primary focus:ring-0 text-sm py-1.5 pl-10 pr-4 w-64 rounded-sm"
            placeholder="Search archives..."
            type="text"
          />
        </div>
        <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
          settings
        </button>
        <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
          account_circle
        </button>
      </div>
    </nav>
  );
}
