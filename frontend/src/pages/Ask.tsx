import { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { Icon } from "../components/ui/Icon";

function EvidenceSidebar() {
  return (
    <div className="p-4 space-y-5 text-[12px]">
      <div className="px-1">
        <div className="flex items-center gap-1.5 text-terracotta mb-0.5">
          <Icon name="biotech" filled className="!text-[14px]" />
          <span className="font-semibold uppercase tracking-[0.06em] text-[10px]">
            Evidence
          </span>
        </div>
        <p className="text-[10px] text-outline-variant uppercase tracking-[0.04em]">
          Clinical Data Stream
        </p>
      </div>

      <div className="space-y-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-outline px-1">
          Matched Findings
        </div>

        <div className="p-3 bg-surface-lowest border border-outline-variant/10 rounded-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-semibold text-secondary bg-secondary-container/50 px-1.5 py-0.5 rounded-xs uppercase tracking-[0.04em]">
              Viability
            </span>
            <span className="font-mono text-[9px] text-outline-variant">FR-204</span>
          </div>
          <p className="text-[11px] font-medium text-on-surface leading-snug">
            Propionamide 2× faster permeation than DMSO at 4°C
          </p>
          <div className="flex gap-3 text-[9px] text-outline font-mono">
            <span>4°C</span>
            <span>97% viab.</span>
            <span>3M conc.</span>
          </div>
        </div>

        <div className="p-3 bg-surface-lowest border border-outline-variant/10 rounded-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-semibold text-primary bg-primary-container/50 px-1.5 py-0.5 rounded-xs uppercase tracking-[0.04em]">
              Toxicity
            </span>
            <span className="font-mono text-[9px] text-outline-variant">FR-119</span>
          </div>
          <p className="text-[11px] font-medium text-on-surface leading-snug">
            FA/GLY neutralization at 12 mol/kg yields 97% viability
          </p>
          <div className="flex gap-3 text-[9px] text-outline font-mono">
            <span>12 mol/kg</span>
            <span>4°C</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-outline-variant/10">
        <div className="space-y-1.5">
          {[
            { label: "Papers", value: "379" },
            { label: "Findings", value: "760" },
            { label: "Compounds", value: "53" },
            { label: "Formulations", value: "41" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-1 py-0.5">
              <span className="text-outline-variant text-[11px]">{label}</span>
              <span className="font-mono text-[11px] text-on-surface">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AskPage() {
  const [query, setQuery] = useState("");

  return (
    <Layout sidebar={<EvidenceSidebar />}>
      <div className="px-8 lg:px-12 py-8 space-y-10">
        <section className="max-w-3xl space-y-6">
          {/* Status chips */}
          <div className="flex items-center gap-2 text-[10px] text-outline-variant uppercase tracking-[0.04em] font-medium">
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-container rounded-sm">
              <span className="w-1 h-1 rounded-full bg-terracotta animate-pulse" />
              379 papers
            </span>
            <span className="text-outline-variant/40">·</span>
            <span>760 findings</span>
            <span className="text-outline-variant/40">·</span>
            <span>53 compounds</span>
          </div>

          {/* Hero */}
          <h1 className="text-[32px] lg:text-[38px] font-semibold tracking-[-0.035em] text-on-surface leading-[1.12]">
            Design a low-toxicity{" "}
            <span className="text-terracotta">CPA cocktail</span> for organ
            vitrification
          </h1>

          {/* Search */}
          <div className="relative">
            <div className="flex items-center bg-surface-lowest border border-outline-variant/20 rounded-md overflow-hidden transition-all focus-within:border-outline-variant/40 focus-within:shadow-[0_0_0_3px_rgba(196,91,61,0.06)]">
              <span className="material-symbols-outlined px-3 text-outline-variant !text-[16px]">
                search
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] text-on-surface py-3 placeholder:text-outline-variant tracking-[-0.01em]"
                type="text"
                placeholder="Ask about cryopreservation..."
              />
              <button className="terracotta-gradient px-5 py-2.5 m-1 rounded-sm text-white text-[11px] font-semibold uppercase tracking-[0.06em] hover:opacity-90 active:scale-[0.98] transition-all">
                Analyze
              </button>
            </div>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              "Compare VS55 vs M22",
              "Kidney vitrification protocols",
              "DMSO alternatives at 4°C",
              "Novel amide-based CPAs",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="px-3 py-1 bg-surface-container/60 hover:bg-surface-high text-[11px] text-on-surface-variant hover:text-on-surface rounded-sm transition-colors tracking-[-0.006em]"
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Results grid */}
        <section className="grid grid-cols-12 gap-4 max-w-5xl">
          {/* Synthesized */}
          <div className="col-span-12 lg:col-span-8 bg-surface-lowest border border-outline-variant/12 rounded-md overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center gap-2 bg-terracotta-muted">
              <Icon name="auto_awesome" filled className="text-terracotta !text-[14px]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-terracotta">
                Synthesized Analysis
              </span>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-[17px] font-medium text-on-surface leading-[1.5] tracking-[-0.015em]">
                Start a query to receive AI-synthesized answers grounded in the
                CryoLens database of{" "}
                <span className="underline decoration-terracotta/25 underline-offset-[3px] decoration-1">
                  100+ papers
                </span>{" "}
                and{" "}
                <span className="underline decoration-terracotta/25 underline-offset-[3px] decoration-1">
                  760 structured findings
                </span>.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-outline-variant">
                    Compounds
                  </span>
                  <p className="text-[13px] font-medium text-on-surface mt-0.5">
                    53 indexed with viability data
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-outline-variant">
                    Protocols
                  </span>
                  <p className="text-[13px] font-medium text-secondary mt-0.5">
                    7 step-by-step procedures
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key sources */}
          <div className="col-span-12 lg:col-span-4 bg-surface-low/50 border border-outline-variant/10 rounded-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-on-surface">
                Key Sources
              </span>
              <span className="text-[10px] text-outline-variant">Top Cited</span>
            </div>
            {[
              { author: "Ahmadkhani et al. (2025)", journal: "Sci. Rep." },
              { author: "Sharma et al. (2023)", journal: "Nat. Commun." },
              { author: "German et al. (2026)", journal: "PNAS" },
            ].map((ref) => (
              <div key={ref.author} className="group flex items-start gap-2.5 cursor-pointer">
                <div className="w-6 h-6 shrink-0 bg-terracotta-muted rounded-xs flex items-center justify-center group-hover:bg-terracotta transition-colors">
                  <span className="material-symbols-outlined text-terracotta group-hover:text-white !text-[13px] transition-colors">
                    menu_book
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-on-surface group-hover:text-terracotta transition-colors leading-tight">
                    {ref.author}
                  </p>
                  <p className="text-[10px] text-outline-variant">{ref.journal}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
