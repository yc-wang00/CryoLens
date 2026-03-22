import { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { Icon } from "../components/ui/Icon";

function EvidenceSidebar() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-terracotta">
            Evidence Explorer
          </span>
          <Icon name="biotech" filled className="text-terracotta" />
        </div>
        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">
          Clinical Data Stream
        </p>
      </div>

      {/* Matched Findings */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-tight text-on-surface border-b border-outline-variant/10 pb-2">
          Matched Findings
        </h3>
        <div className="p-3 bg-surface-lowest border-b border-outline-variant/20 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-secondary px-1.5 py-0.5 bg-secondary-container rounded-sm uppercase">
              Viability
            </span>
            <span className="text-[10px] font-medium text-on-surface-variant">
              FR-204
            </span>
          </div>
          <h4 className="text-xs font-semibold leading-tight text-on-surface">
            Propionamide 2× faster permeation than DMSO at 4°C
          </h4>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-on-surface-variant">
              <span className="material-symbols-outlined !text-[12px]">thermostat</span>
              4°C
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-on-surface-variant">
              <span className="material-symbols-outlined !text-[12px]">humidity_low</span>
              97%
            </div>
          </div>
        </div>
        <div className="p-3 bg-surface-low/50 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 bg-primary-container rounded-sm uppercase">
              Toxicity
            </span>
            <span className="text-[10px] font-medium text-on-surface-variant">
              FR-119
            </span>
          </div>
          <h4 className="text-xs font-semibold leading-tight text-on-surface">
            FA/GLY neutralization at 12 mol/kg yields 97% viability
          </h4>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-on-surface-variant">
              <span className="material-symbols-outlined !text-[12px]">science</span>
              12 mol/kg
            </div>
          </div>
        </div>
      </div>

      <button className="mt-auto w-full py-3 terracotta-gradient text-white text-[10px] font-bold uppercase tracking-widest rounded-sm active:scale-[0.98] transition-transform shadow-lg shadow-terracotta/20">
        Export Analysis
      </button>
    </div>
  );
}

export function AskPage() {
  const [query, setQuery] = useState("");

  return (
    <Layout sidebar={<EvidenceSidebar />}>
      <div className="p-8 lg:p-12 space-y-12">
        <section className="max-w-4xl mx-auto space-y-8">
          {/* Status Bar */}
          <div className="flex items-center gap-3 text-on-surface-variant mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-high rounded-full text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
              379 papers
            </div>
            <span className="text-outline-variant">/</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">760 findings</span>
            <span className="text-outline-variant">/</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">53 molecules</span>
            <span className="text-outline-variant">/</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">41 formulations</span>
          </div>

          {/* Hero Question */}
          <h1 className="text-4xl lg:text-5xl font-headline font-extrabold tracking-tight text-on-surface leading-[1.1]">
            Design a low-toxicity{" "}
            <span className="text-terracotta">CPA cocktail</span> for organ
            vitrification
          </h1>

          {/* Search Input */}
          <div className="relative group">
            <div className="absolute inset-0 bg-terracotta/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center bg-surface-low rounded-lg p-2 transition-all duration-300 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-on-surface/5">
              <span className="material-symbols-outlined px-4 text-on-surface-variant">
                search
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-medium text-on-surface placeholder:text-outline-variant font-headline"
                type="text"
                placeholder="Ask about cryopreservation..."
              />
              <button className="terracotta-gradient px-8 py-3 rounded-md text-white font-bold text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all">
                Analyze
              </button>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-2">
            {[
              "Compare VS55 vs M22",
              "Kidney vitrification protocols",
              "DMSO toxicity mitigation at 4°C",
              "Novel amide-based CPAs",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="px-4 py-1.5 bg-surface-high hover:bg-surface-highest transition-colors rounded-full text-[11px] font-bold uppercase tracking-wider text-on-surface-variant"
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Result Grid */}
        <section className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
          {/* Synthesized Answer */}
          <div className="col-span-12 lg:col-span-8 bg-surface-lowest border border-outline-variant/10 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-terracotta/10 px-6 py-4 border-b border-terracotta/5 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-terracotta"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta">
                Synthesized Analysis
              </span>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-xl lg:text-2xl font-headline font-semibold text-on-surface leading-snug">
                Start a query to receive AI-synthesized answers grounded in
                the CryoLens database of{" "}
                <span className="underline decoration-terracotta/30 underline-offset-4">
                  100+ papers
                </span>{" "}
                and{" "}
                <span className="underline decoration-terracotta/30 underline-offset-4">
                  760 structured findings
                </span>
                .
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Compounds
                  </h4>
                  <p className="text-sm font-medium text-on-surface">
                    53 indexed with viability data
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Protocols
                  </h4>
                  <p className="text-sm font-medium text-secondary">
                    7 step-by-step procedures
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Sources */}
          <div className="col-span-12 lg:col-span-4 bg-surface-low rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface">
                Key Sources
              </h3>
              <span className="text-[10px] font-bold text-on-surface-variant">
                Top Cited
              </span>
            </div>
            <div className="space-y-4">
              {[
                { author: "Ahmadkhani et al. (2025)", journal: "Scientific Reports" },
                { author: "Sharma et al. (2023)", journal: "Nature Communications" },
                { author: "German et al. (2026)", journal: "PNAS" },
              ].map((ref) => (
                <div key={ref.author} className="group flex items-start gap-3 cursor-pointer">
                  <div className="w-8 h-8 shrink-0 bg-terracotta/10 rounded flex items-center justify-center group-hover:bg-terracotta transition-colors">
                    <span className="material-symbols-outlined text-terracotta group-hover:text-white transition-colors">
                      menu_book
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight group-hover:text-terracotta transition-colors">
                      {ref.author}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      {ref.journal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
