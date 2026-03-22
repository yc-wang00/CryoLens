import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/ask", label: "Ask" },
  { to: "/hypotheses", label: "Hypotheses" },
  { to: "/molecules", label: "Molecules" },
  { to: "/sources", label: "Sources" },
];

export function TopNav() {
  return (
    <nav className="fixed top-0 w-full z-50 h-12 bg-surface-lowest/80 backdrop-blur-xl border-b border-outline-variant/15 flex items-center justify-between px-5">
      <div className="flex items-center gap-7">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-5 h-5 bg-terracotta rounded-xs" />
          <span className="text-[13px] font-semibold tracking-[-0.04em] text-on-surface uppercase">
            CryoLens
          </span>
        </NavLink>
        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1 text-[12px] tracking-[-0.01em] font-medium transition-colors rounded-sm ${
                  isActive
                    ? "text-on-surface bg-surface-high/60"
                    : "text-outline hover:text-on-surface"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline-variant !text-[15px]">
            search
          </span>
          <input
            className="bg-surface-low border border-outline-variant/20 focus:border-outline focus:outline-none text-[12px] py-1.5 pl-8 pr-3 w-52 rounded-sm text-on-surface placeholder:text-outline-variant"
            placeholder="Search..."
            type="text"
          />
        </div>
        <button className="w-7 h-7 flex items-center justify-center text-outline hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined !text-[16px]">tune</span>
        </button>
      </div>
    </nav>
  );
}
